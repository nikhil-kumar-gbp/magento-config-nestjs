import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly staticBearerToken: string;
  constructor(private readonly configService: ConfigService) {
    this.staticBearerToken =
      this.configService.get('STATIC_BEARER_TOKEN') ?? '';
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization?.split(' ')[1];


    if (!token || token !== this.staticBearerToken) {
      return false;
    }

    return true;
  }
}
