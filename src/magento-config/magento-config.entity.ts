import { CoreConfigScope } from '@/types/magento-config.types.js';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'core_config_data',
})
export class CoreConfig {
  @PrimaryGeneratedColumn()
  config_id: number;

  @Column()
  scope: CoreConfigScope;

  @Column()
  scope_id: number;

  @Column()
  path: string;

  @Column()
  value: string;

  @UpdateDateColumn()
  updated_at: Date;
}
