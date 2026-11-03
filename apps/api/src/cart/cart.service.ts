import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";

export interface CartItemRow {
  id: string;
  productId: string;
  product: {
    id: string;
    code: string;
    name: string;
    retailPrice: number | null;
    taxRate: number;
  };
  quantity: number;
}

export interface CartRow {
  id: string;
  customerId: string;
  items: CartItemRow[];
}

@Injectable()
export class CartService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOrCreateCart(customerId: string): Promise<DbResult<CartRow>> {
    return withDb(
      this.prisma,
      async (db) => {
        return this.getOrCreateCartDb(db, customerId);
      },
      () => ({ id: `mock-${customerId}`, customerId, items: [] }),
    );
  }

  async addItem(
    customerId: string,
    productId: string,
    quantity: number,
  ): Promise<DbResult<CartRow>> {
    return withDb(
      this.prisma,
      async (db) => {
        const product = await db.product.findUnique({
          where: { id: productId },
          select: { id: true, active: true, deletedAt: true },
        });
        if (!product || !product.active || product.deletedAt) {
          throw new BadRequestException("Product not found or inactive");
        }

        const cart = await this.getOrCreateCartDb(db, customerId);

        const existing = await db.cartItem.findFirst({
          where: { cartId: cart.id, productId },
        });

        if (existing) {
          await db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + quantity },
          });
        } else {
          await db.cartItem.create({
            data: { cartId: cart.id, productId, quantity },
          });
        }

        return this.getOrCreateCartDb(db, customerId);
      },
      () => ({ id: `mock-${customerId}`, customerId, items: [] }),
    );
  }

  async updateItem(
    customerId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<DbResult<CartRow | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const cart = await this.getOrCreateCartDb(db, customerId);
        const item = await db.cartItem.findFirst({
          where: { id: cartItemId, cartId: cart.id },
        });
        if (!item) throw new NotFoundException("Cart item not found");

        if (quantity <= 0) {
          await db.cartItem.delete({ where: { id: cartItemId } });
        } else {
          await db.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
          });
        }

        return this.getOrCreateCartDb(db, customerId);
      },
      () => null,
    );
  }

  async removeItem(customerId: string, cartItemId: string): Promise<DbResult<boolean>> {
    return withDb(
      this.prisma,
      async (db) => {
        const cart = await this.getOrCreateCartDb(db, customerId);
        const item = await db.cartItem.findFirst({
          where: { id: cartItemId, cartId: cart.id },
        });
        if (!item) throw new NotFoundException("Cart item not found");
        await db.cartItem.delete({ where: { id: cartItemId } });
        return true;
      },
      () => true,
    );
  }

  private async getOrCreateCartDb(
    db: Prisma.TransactionClient | ReturnType<PrismaService["get"]>,
    customerId: string,
  ): Promise<CartRow> {
    let cart = await db.cart.findFirst({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                retailPrice: true,
                taxRate: true,
              },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await db.cart.create({
        data: { customerId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  retailPrice: true,
                  taxRate: true,
                },
              },
            },
          },
        },
      });
    }
    return {
      id: cart.id,
      customerId: cart.customerId,
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: {
          id: i.product.id,
          code: i.product.code,
          name: i.product.name,
          retailPrice: Number(i.product.retailPrice ?? 0),
          taxRate: Number(i.product.taxRate),
        },
        quantity: i.quantity,
      })),
    };
  }
}
