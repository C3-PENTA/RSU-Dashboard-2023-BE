import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePolicyDto } from '../dto/policy.dto';
import { Policies } from '../entity/policy.entity';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policies) private policyRepository: Repository<Policies>,
  ) {}

  async findAll(): Promise<Policies[]> {
    return this.policyRepository
      .createQueryBuilder('policy')
      .select([
        '"policy"."id"',
        '"policy"."name"',
        '"policy"."cpu_limit"',
        '"policy"."cpu_thresh"',
        '"policy"."num_edges"',
        '"policy"."is_activated"',
      ])
      .orderBy('"policy"."name"', 'ASC')
      .execute() as Promise<Policies[]>;
  }

  async findOne(id: string) {
    const policyData: Policies = await this.policyRepository.findOne({
      id,
    });
    const description =
      `When a file is sent to an RSU, it will first check its CPU usage. ` +
      `If the CPU usage is greater than ${policyData.cpu_limit}%, the RSU will distribute the file itself. ` +
      `Otherwise, it will seek ${policyData.num_edges} other RSU ` +
      `whose CPU usage is less than ${policyData.cpu_thresh}% and send the file to them`;
    return {
      ...policyData,
      description: description,
    };
  }

  async updatePolicy(id: string, data: UpdatePolicyDto) {
    await this.policyRepository.update(id, data);
    return this.findOne(id);
  }
}
