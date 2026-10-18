import { Router } from 'express';

export default function createRoleRouter(roleController) {
    const router = Router();

    router.get('/', roleController.getAll);

    return router;
}