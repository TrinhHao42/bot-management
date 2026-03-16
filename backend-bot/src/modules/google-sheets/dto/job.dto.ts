import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class JobDto {
  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  salary: string;

  @IsString()
  level: string;

  @IsUrl()
  url: string;
}
