import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRoles } from '../entity/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(UserRoles)
    private roleRepository: Repository<UserRoles>,
  ) {}

  async findOne(
    identifier: string,
    searchBy: 'name',
  ): Promise<UserRoles | undefined> {
    const filter: Record<string, string> = {};

    filter[searchBy] = identifier;

    const role = await this.roleRepository.findOne(filter);

    return role;
  }
}
