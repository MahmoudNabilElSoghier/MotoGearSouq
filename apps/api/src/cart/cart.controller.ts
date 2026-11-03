import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiTags } from "@nestjs/swagger";
import { CustomerAuthGuard } from "../common/guards/customer-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { cartItemSchema, type CartItemInput } from "./dto/cart-item.schema";
import { updateCartItemSchema, type UpdateCartItemInput } from "./dto/cart-item.schema";
import { CartService } from "./cart.service";

@ApiTags("cart")
@Controller("cart")
export class CartController {
  constructor(@Inject(CartService) private readonly cart: CartService) {}

  private customerId(req: Request & { user?: { sub?: string } }): string {
    const customerId = req.user?.sub;
    if (!customerId) {
      throw new NotFoundException("Customer ID missing from token");
    }
    return customerId;
  }

  @Get()
  @UseGuards(CustomerAuthGuard)
  async getCart(@Req() req: Request & { user?: { sub?: string } }) {
    return this.cart.getOrCreateCart(this.customerId(req));
  }

  @Post("items")
  @UseGuards(CustomerAuthGuard)
  async addItem(
    @Body(new ZodValidationPipe(cartItemSchema)) body: CartItemInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.cart.addItem(this.customerId(req), body.productId, body.quantity);
  }

  @Patch("items/:id")
  @UseGuards(CustomerAuthGuard)
  async updateItem(
    @Param("id") cartItemId: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) body: UpdateCartItemInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.cart.updateItem(this.customerId(req), cartItemId, body.quantity);
  }

  @Delete("items/:id")
  @UseGuards(CustomerAuthGuard)
  async removeItem(
    @Param("id") cartItemId: string,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.cart.removeItem(this.customerId(req), cartItemId);
  }
}
