import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

import * as orderController from "../controllers/order-controller.js";

const router = Router();

router.get("/", authenticate, orderController.getAllOrders);
router.post("/orders_date_range", authenticate, orderController.getOrdersRange);
router.get("/:orderId", authenticate, orderController.getOrderById);
router.get("/trip_orders/:tripId", authenticate, orderController.getTripOrders);
router.post("/", authenticate, orderController.createOrder);
router.put(
    "/package_info/:orderId",
    authenticate,
    orderController.updateOrderPackageInfo,
);
router.put("/status/:orderId", authenticate, orderController.updateOrderStatus);
router.put("/assign/:orderId", authenticate, orderController.assignOrderToTrip);
router.delete("/:orderId", authenticate, orderController.deleteOrder);

export default router;
