import { Router } from "express";
const router = Router();

/** import controllers */
import * as controller from '../controllers/controller.js';



/** Questions Routes API */

router.route('/questions')
        .get(controller.getQuestions) /** GET Request */
        .post(controller.insertQuestions) /** POST Request */
        .delete(controller.dropQuestions) /** DELETE Request */

router.route('/result')
        .get(controller.getResult)
        .post(controller.storeResult)
        .delete(controller.dropResult)

// Add these routes after the existing questions routes:

/** Admin Routes API */
router.route('/admin/login')
        .post(controller.adminLogin) /** Admin Login */

router.route('/admin/questions')
        .get(controller.getAdminQuestions) /** Get questions with answers for admin */
        .post(controller.createQuestion) /** Create single question */
        .put(controller.updateQuestion) /** Update question */

router.route('/admin/questions/:id')
        .delete(controller.deleteQuestion) /** Delete single question */

/** Answer CRUD Routes */
router.route('/admin/answers')
        .get(controller.getAnswers) /** Get all answers */
        .post(controller.createAnswer) /** Create/Add answer */
        .put(controller.updateAnswers) /** Update all answers */

router.route('/admin/answers/:questionId')
        .put(controller.updateAnswer) /** Update single answer */
        .delete(controller.deleteAnswer) /** Delete single answer */

/** User Routes API */
router.route('/user/login')
        .post(controller.userLogin) /** User Login */

router.route('/user/questions')
        .get(controller.getUserQuestions) /** Get questions for users (no answers) */


export default router;









