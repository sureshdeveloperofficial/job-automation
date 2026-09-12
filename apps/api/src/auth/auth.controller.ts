import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser, type CurrentUserData } from './decorators/current-user.decorator.js';
import { SignUpSchema, SignInSchema, RefreshTokenSchema } from '@career-os/schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { SignUpDto, SignInDto, RefreshTokenDto } from '@career-os/schemas';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async signUp(@Body(new ZodValidationPipe(SignUpSchema)) dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Signed in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body(new ZodValidationPipe(SignInSchema)) dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out and revoke refresh token' })
  async signOut(
    @CurrentUser() user: CurrentUserData,
    @Body(new ZodValidationPipe(RefreshTokenSchema)) dto: RefreshTokenDto,
  ) {
    void user; // user is validated via guard
    await this.authService.signOut(dto.refreshToken);
  }
}
