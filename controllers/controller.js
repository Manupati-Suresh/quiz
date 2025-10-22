import Questions from "../models/questionSchema.js";
import Results from "../models/resultSchema.js";
import questions, { answers } from '../database/data.js';

/** get all questions */
export async function getQuestions(req, res){
    try {
        const q = await Questions.find();
        res.json(q)
    } catch (error) {
        res.json({ error })
    }
}

/** insert all questions */
export async function insertQuestions(req, res){
    try {
        await Questions.create({ questions, answers });
        res.json({ msg: "Data Saved Successfully...!"})
    } catch (error) {
        res.json({ error })
    }
}

/** Delete all Questions */
export async function dropQuestions(req, res){
   try {
        await Questions.deleteMany();
        res.json({ msg: "Questions Deleted Successfully...!"});
   } catch (error) {
        res.json({ error })
   }
}

/** get all result */
export async function getResult(req, res){
    try {
        const r = await Results.find();
        res.json(r)
    } catch (error) {
        res.json({ error })
    }
}

/** post all result */
export async function storeResult(req, res){
   try {
        const { username, result, attempts, points, achived } = req.body;
        if(!username && !result) throw new Error('Data Not Provided...!');

        await Results.create({ username, result, attempts, points, achived });
        res.json({ msg : "Result Saved Successfully...!"})

   } catch (error) {
        res.json({error})
   }
}

/** delete all result */
export async function dropResult(req, res){
    try {
        await Results.deleteMany();
        res.json({ msg : "Result Deleted Successfully...!"})
    } catch (error) {
        res.json({ error })
    }
}

/** Admin Login */
export async function adminLogin(req, res){
    try {
        const { username, password } = req.body;
        if(username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD){
            res.json({ success: true, msg: "Admin Login Successful", token: "admin-token" });
        } else {
            res.status(401).json({ success: false, msg: "Invalid Credentials" });
        }
    } catch (error) {
        res.json({ error })
    }
}

/** Get questions with answers for admin */
export async function getAdminQuestions(req, res){
    try {
        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.json({ questions: [], answers: [] });
        }

        res.json({ 
            questions: questionsDoc.questions || [], 
            answers: questionsDoc.answers || [],
            total: questionsDoc.questions ? questionsDoc.questions.length : 0
        });
    } catch (error) {
        res.json({ error })
    }
}

/** Create single question */
export async function createQuestion(req, res){
    try {
        const { question, options } = req.body;
        if(!question || !options || options.length < 2) {
            return res.status(400).json({ error: "Question and at least 2 options required" });
        }

        // Get existing questions document or create new one
        let questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            questionsDoc = await Questions.create({ questions: [], answers: [] });
        }

        const newQuestion = {
            id: questionsDoc.questions.length + 1,
            question,
            options
        };

        questionsDoc.questions.push(newQuestion);
        await questionsDoc.save();

        res.json({ msg: "Question Created Successfully", question: newQuestion });
    } catch (error) {
        res.json({ error })
    }
}

/** Update question */
export async function updateQuestion(req, res){
    try {
        const { id, question, options } = req.body;
        
        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.status(404).json({ error: "No questions found" });
        }

        const questionIndex = questionsDoc.questions.findIndex(q => q.id === parseInt(id));
        if(questionIndex === -1) {
            return res.status(404).json({ error: "Question not found" });
        }

        questionsDoc.questions[questionIndex] = { id: parseInt(id), question, options };
        await questionsDoc.save();

        res.json({ msg: "Question Updated Successfully" });
    } catch (error) {
        res.json({ error })
    }
}

/** Delete single question */
export async function deleteQuestion(req, res){
    try {
        const { id } = req.params;
        
        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.status(404).json({ error: "No questions found" });
        }

        questionsDoc.questions = questionsDoc.questions.filter(q => q.id !== parseInt(id));
        await questionsDoc.save();

        res.json({ msg: "Question Deleted Successfully" });
    } catch (error) {
        res.json({ error })
    }
}

/** User Login */
export async function userLogin(req, res){
    try {
        const { username, password } = req.body;
        // Simple user validation - in production, use proper authentication
        if(username && password && username.length > 2 && password.length > 3){
            res.json({ success: true, msg: "User Login Successful", token: "user-token", username });
        } else {
            res.status(401).json({ success: false, msg: "Invalid Credentials - Username must be 3+ chars, Password 4+ chars" });
        }
    } catch (error) {
        res.json({ error })
    }
}

/** Get questions for users (without answers) */
export async function getUserQuestions(req, res){
    try {
        const questionsDoc = await Questions.findOne();
        if(!questionsDoc || !questionsDoc.questions) {
            return res.json({ questions: [] });
        }

        // Return questions without answers for security
        const userQuestions = questionsDoc.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options
        }));

        res.json({ questions: userQuestions, total: userQuestions.length });
    } catch (error) {
        res.json({ error })
    }
}

/** Get all answers */
export async function getAnswers(req, res){
    try {
        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.json({ answers: [], questions: [] });
        }

        const answersWithQuestions = questionsDoc.questions.map((q, index) => ({
            questionId: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: questionsDoc.answers[index] || null,
            correctAnswerText: q.options[questionsDoc.answers[index]] || 'Not set'
        }));

        res.json({ 
            answers: questionsDoc.answers || [], 
            answersWithQuestions,
            total: questionsDoc.questions.length 
        });
    } catch (error) {
        res.json({ error })
    }
}

/** Create/Add answer for a question */
export async function createAnswer(req, res){
    try {
        const { questionId, answerIndex } = req.body;
        
        if(answerIndex === undefined || questionId === undefined) {
            return res.status(400).json({ error: "Question ID and answer index required" });
        }

        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.status(404).json({ error: "No questions found" });
        }

        const questionIndex = questionsDoc.questions.findIndex(q => q.id === parseInt(questionId));
        if(questionIndex === -1) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Ensure answers array is same length as questions
        while(questionsDoc.answers.length < questionsDoc.questions.length) {
            questionsDoc.answers.push(null);
        }

        questionsDoc.answers[questionIndex] = parseInt(answerIndex);
        await questionsDoc.save();

        res.json({ msg: "Answer created successfully", questionId, answerIndex });
    } catch (error) {
        res.json({ error })
    }
}

/** Update single answer */
export async function updateAnswer(req, res){
    try {
        const { questionId } = req.params;
        const { answerIndex } = req.body;
        
        if(answerIndex === undefined) {
            return res.status(400).json({ error: "Answer index required" });
        }

        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.status(404).json({ error: "No questions found" });
        }

        const questionIndex = questionsDoc.questions.findIndex(q => q.id === parseInt(questionId));
        if(questionIndex === -1) {
            return res.status(404).json({ error: "Question not found" });
        }

        // Ensure answers array is same length as questions
        while(questionsDoc.answers.length < questionsDoc.questions.length) {
            questionsDoc.answers.push(null);
        }

        questionsDoc.answers[questionIndex] = parseInt(answerIndex);
        await questionsDoc.save();

        res.json({ msg: "Answer updated successfully", questionId, answerIndex });
    } catch (error) {
        res.json({ error })
    }
}

/** Update all answers */
export async function updateAnswers(req, res){
    try {
        const { answers } = req.body;
        
        if(!Array.isArray(answers)) {
            return res.status(400).json({ error: "Answers must be an array" });
        }

        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.status(404).json({ error: "No questions found" });
        }

        questionsDoc.answers = answers;
        await questionsDoc.save();

        res.json({ msg: "All answers updated successfully", answers });
    } catch (error) {
        res.json({ error })
    }
}

/** Delete single answer */
export async function deleteAnswer(req, res){
    try {
        const { questionId } = req.params;
        
        const questionsDoc = await Questions.findOne();
        if(!questionsDoc) {
            return res.status(404).json({ error: "No questions found" });
        }

        const questionIndex = questionsDoc.questions.findIndex(q => q.id === parseInt(questionId));
        if(questionIndex === -1) {
            return res.status(404).json({ error: "Question not found" });
        }

        if(questionsDoc.answers.length > questionIndex) {
            questionsDoc.answers[questionIndex] = null;
            await questionsDoc.save();
        }

        res.json({ msg: "Answer deleted successfully", questionId });
    } catch (error) {
        res.json({ error })
    }
}