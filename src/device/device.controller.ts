import { Controller, Get, HttpStatus, Inject, Injectable, NotFoundException, Param, Post, Put, Res, Body } from '@nestjs/common';
import { DeviceService } from './device.service';
import { MqttAccessDesc } from './interfaces/device.interface';
import { UpdateCategoryDTO } from './dto/updateCategory';
import { UpdateConfigDTO } from './dto/updateConfig';
import { ApiTags } from '@nestjs/swagger';
import { MqttService } from 'nest-mqtt';

@ApiTags('device')
@Controller('device')
export class DeviceController {
  constructor(private deviceService: DeviceService, @Inject(MqttService) private readonly mqttService: MqttService) { }

  @Get('/')
  async findAll(@Res() res) {
    const devices = await this.deviceService.findAll();
    return res.status(HttpStatus.OK).json(
      devices
    );
  }

  @Get('/:deviceId')
  async findById(@Res() res, @Param('deviceId') deviceId: string) {
    const device = await this.deviceService.findById(deviceId);
    if (!device) throw new NotFoundException(device);
    return res.status(HttpStatus.OK).json(
      device
    );
  }

  @Put('/:deviceId/zone/:zoneId')
  async linkToZone(@Res() res, @Param('deviceId') deviceId: string, @Param('zoneId') zoneId: string) {
    const updatedDevice = await this.deviceService.linkToZone(deviceId, zoneId);
    if (!updatedDevice) throw new NotFoundException(deviceId);
    return res.status(HttpStatus.OK).json(
      updatedDevice
    );
  }

  @Post('/:deviceId/category')
  async updateCategory(@Res() res, @Param('deviceId') deviceId: string, @Body() updateCategoryDTO: UpdateCategoryDTO) {
    const updatedDevice = await this.deviceService.updateCategory(deviceId, updateCategoryDTO);
    if (!updatedDevice) throw new NotFoundException(deviceId);
    return res.status(HttpStatus.OK).json(
        updatedDevice
    );
  }

  @Post('/:deviceId/config')
  async updateConfig(@Res() res, @Param('deviceId') deviceId: string, @Body() updateConfigDTO: UpdateConfigDTO) {
    const updatedDevice = await this.deviceService.updateConfig(deviceId, updateConfigDTO);
    if (!updatedDevice) throw new NotFoundException(deviceId);
    return res.status(HttpStatus.OK).json(
        updatedDevice
    );
  }

  @Post('/:deviceId/action/:capability/:value')
  async action(@Res() res, @Param('deviceId') deviceId: string, @Param('capability') capability: string, @Param('value') value: any) {
    const device = await this.deviceService.findById(deviceId);
    try {
      const capabilityAccessor: MqttAccessDesc = device.capabilities[capability].set;
      if (capabilityAccessor.type === 'boolean') {
        if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        }
      }
      let message = null;
      if (capabilityAccessor.format === 'raw') {
        message = value.toString();
      } else {
      // TODO: Gérer multi niveau dans le path du json
        message[capabilityAccessor.path] = value;
      }
      this.mqttService.publish(capabilityAccessor.topic, message);
      return res.status(HttpStatus.OK).json(
        message
      );
    } catch (_) {
      throw new NotFoundException(device);
    }
  }
}
