import { Controller, Get, HttpStatus, Inject, Injectable, NotFoundException, Param, Post, Put, Res } from '@nestjs/common';
import { DeviceService } from './device.service';
import { MqttAccessDesc } from './interfaces/device.interface';
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
  async linkToSoze(@Res() res, @Param('deviceId') deviceId: string, @Param('zoneId') zoneId: string) {
    const updatedDevice = await this.deviceService.linkToZone(deviceId, zoneId);
    if (!updatedDevice) throw new NotFoundException(deviceId);
    return res.status(HttpStatus.OK).json(
      updatedDevice
    );
  }

  @Post('/:deviceId/action/:capability/:value')
  async action(@Res() res, @Param('deviceId') deviceId: string, @Param('capability') capability: string, @Param('value') value: string) {
    const device = await this.deviceService.findById(deviceId);
    try {
      const capabilityAccessor: MqttAccessDesc = device.capabilities[capability].set;
      const message = {};
      // TODO: Gérer multi niveau dans le path du json
      message[capabilityAccessor.path] = value;
      this.mqttService.publish(capabilityAccessor.topic, message);
      return res.status(HttpStatus.OK).json(
        message
      );
    } catch (_) {
      throw new NotFoundException(device);
    }
  }
}
