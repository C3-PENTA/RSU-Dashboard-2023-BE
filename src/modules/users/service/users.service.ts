import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from '../dto/createUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entity/users.entity';
import { UserRoles } from 'src/modules/role/entity/role.entity';
import { Repository } from 'typeorm';
import { RoleService } from 'src/modules/role/service/role.service';
import { Role } from 'src/constants';
import { UpdateUserDto } from '../dto/updateUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    private roleService: RoleService,
  ) {}

  async findAll() {
    return this.userRepository
      .createQueryBuilder('users')
      .innerJoinAndSelect(UserRoles, 'user_role', 'user_role.id = users.role ')
      .select([
        'users.id AS id',
        'users.username AS username',
        'users.name AS name',
        'users.email AS email',
        'user_role.name AS role',
        'users.created_at as "createdAt"',
        'users.updated_at as "updatedAt"',
      ])
      .orderBy('users.name', 'ASC')
      .getRawMany();
  }


  async findOne(
    identifier: string,
    searchBy: 'username' | 'email' | 'role',
  ): Promise<Users | undefined> {
    const query = this.userRepository
      .createQueryBuilder('users')
      .innerJoinAndSelect('users.role', 'user_roles');

    let whereCondition: string;

    switch (searchBy) {
      case 'username':
        whereCondition = 'users.username = :identifier';
        break;
      case 'email':
        whereCondition = 'users.email = :identifier';
        break;
      case 'role':
        whereCondition = 'user_roles.name = :identifier';
        break;
      default:
        throw new HttpException(
          'Invalid search criteria',
          HttpStatus.BAD_REQUEST,
        );
    }

    const user = await query.where(whereCondition, { identifier }).getOne();
    return user;
  }

  async findMany(identifier: string, searchBy: 'username' | 'email' | 'role', reversed: boolean = false) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .innerJoin(UserRoles, 'user_role', 'user_role.id = users.role')
      .select([
        'users.id as id',
        'users.username as username',
        'users.name as name',
        'users.email as email',
        'user_role.name as role',
        'users.created_at as "createdAt"',
        'users.updated_at as "updatedAt"',
      ])
      .where('user_role.name = :role', { role: identifier})
      .orderBy('"users"."name"', 'ASC')

      const condition = !reversed ? '=' : '!=';
      if (searchBy === 'username') {
        queryBuilder.where(`users.username ${condition} :identifier`, { identifier });
      } else if (searchBy === 'email') {
        queryBuilder.where(`users.email ${condition} :identifier`, { identifier });
      } else if (searchBy === 'role') {
        queryBuilder.where(`user_role.name ${condition} :identifier`, { identifier });
      }

      return queryBuilder.getRawMany();
  }

  async create(userData: CreateUserDto) {
    const newUser = await this.userRepository.create(userData);
    const defaultRole = await this.roleService.findOne('NORMAL', 'name');
    newUser.role = defaultRole.id;
    await this.userRepository.save(newUser);
    return newUser;
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    await this.userRepository.update(userId, data);
    return this.userRepository.findOne(userId);
  }

  async deleteUser(userId: string) {
    try {
      const result = await this.userRepository.findOne(userId)
      if (result.role['name'] == 'OPERATOR') throw new Error('Cannot delete OPERATOR');
      await this.userRepository.delete(userId);
    } catch (err) {
      console.error(err.message);
    }
  }

  async setCurrentRefreshToken(userName: string, token: string) {
    try {
      const user = await this.findOne(userName, 'username');
      await this.userRepository.update(user.id, { refreshToken: token});
    } catch (err) {
      throw err;
    }
  }
}
