import mongoose from 'mongoose';
import Product from './models/Product';
import InventoryHold from './models/InventoryHold';

/**
 * Reserve inventory for a specific variant (pessimistic lock/hold on checkout).
 * Decrements MongoDB product stock atomically and creates a hold record.
 */
export async function reserveInventory(
  productId: string | mongoose.Types.ObjectId,
  size: string,
  color: string,
  quantity: number,
  holderId: string,
  holdMinutes: number = 15
): Promise<{ success: boolean; error?: string }> {
  try {
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    // Atomically decrement the stock in the variant array ONLY if variant stock >= requested quantity
    const result = await Product.updateOne(
      {
        _id: productId,
        variants: {
          $elemMatch: {
            size: size,
            color: color,
            stock: { $gte: quantity },
          },
        },
      },
      {
        $inc: { "variants.$.stock": -quantity },
      }
    );

    if (result.modifiedCount === 0) {
      return { success: false, error: 'Insufficient stock or variant not found' };
    }

    // Create the inventory hold record
    await InventoryHold.create({
      productId,
      size,
      color,
      quantity,
      holderId,
      expiresAt,
      status: 'pending',
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to reserve inventory:', err);
    return { success: false, error: err.message || 'Inventory reservation failed' };
  }
}

/**
 * Release a previously reserved inventory hold (restores stock to variant).
 */
export async function releaseInventory(
  productId: string | mongoose.Types.ObjectId,
  size: string,
  color: string,
  quantity: number,
  holderId: string
): Promise<boolean> {
  try {
    // Find the hold
    const hold = await InventoryHold.findOne({
      productId,
      size,
      color,
      holderId,
      status: 'pending',
    });

    if (!hold) return false;

    // Restore stock
    await Product.updateOne(
      {
        _id: productId,
        "variants.size": size,
        "variants.color": color,
      },
      {
        $inc: { "variants.$.stock": quantity },
      }
    );

    // Mark as released
    hold.status = 'released';
    await hold.save();

    return true;
  } catch (err) {
    console.error('Failed to release inventory:', err);
    return false;
  }
}

/**
 * Commit a previously reserved inventory hold (permanently finalize decrement).
 */
export async function commitInventory(
  productId: string | mongoose.Types.ObjectId,
  size: string,
  color: string,
  holderId: string
): Promise<boolean> {
  try {
    const hold = await InventoryHold.findOne({
      productId,
      size,
      color,
      holderId,
      status: 'pending',
    });

    if (!hold) return false;

    // Mark as committed
    hold.status = 'committed';
    await hold.save();

    return true;
  } catch (err) {
    console.error('Failed to commit inventory:', err);
    return false;
  }
}

/**
 * Sweeper function to clean up expired inventory holds and restore their stock.
 * Run periodically (e.g. via Vercel Cron or request triggers).
 */
export async function releaseExpiredReservations(): Promise<number> {
  try {
    const now = new Date();
    // Find expired pending holds
    const expiredHolds = await InventoryHold.find({
      expiresAt: { $lte: now },
      status: 'pending',
    });

    let releasedCount = 0;
    for (const hold of expiredHolds) {
      // Restore stock
      await Product.updateOne(
        {
          _id: hold.productId,
          "variants.size": hold.size,
          "variants.color": hold.color,
        },
        {
          $inc: { "variants.$.stock": hold.quantity },
        }
      );

      hold.status = 'released';
      await hold.save();
      releasedCount++;
    }

    return releasedCount;
  } catch (err) {
    console.error('Failed to clean up expired inventory holds:', err);
    return 0;
  }
}
