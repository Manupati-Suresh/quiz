import Questions from "../models/questionSchema.js";
import Results from "../models/resultSchema.js";
import User from "../models/userSchema.js";
import { redisUtils } from '../database/redis.js';
import questions, { answers } from '../database/data.js';

/** get all questions GET */
export async function getQuestions(req, res){
    try {
        const q = await Questions.find();
        res.json(q)
    } catch (error) {
        res.json({ error })
    }
}

/** insert all questions POST */
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



/** Get active users from Redis */
export async function getActiveUsers(req, res){
    try {
        const activeUsers = await redisUtils.getActiveUsers();
        
        res.json({
            activeUsers,
            count: activeUsers.length,
            timestamp: new Date()
        });
    } catch (error) {
        res.json({ error: error.message })
    }
}

/** Get Redis statistics */
export async function getRedisStats(req, res){
    try {
        // This would require additional Redis commands
        // For now, return basic info
        res.json({
            status: 'connected',
            message: 'Redis is operational',
            timestamp: new Date()
        });
    } catch (error) {
        res.json({ error: error.message })
    }
}

/** User logout - clear Redis session */
export async function userLogout(req, res){
    try {
        const { userId, username } = req.body;
        
        if (userId) {
            await redisUtils.deleteUserSession(userId);
        }
        
        // Clear Express session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
        });

        res.json({ 
            success: true, 
            msg: "Logged out successfully" 
        });
    } catch (error) {
        res.json({ error: error.message })
    }
}

/** Get user profile */
export async function getUserProfile(req, res){
    try {
        const { username } = req.params;
        
        // Try Redis cache first
        let cachedProfile = await redisUtils.getUserProfile(username);
        let cachedStats = await redisUtils.getUserStats(username);

        if (cachedProfile && cachedStats) {
            return res.json({
                user: cachedProfile,
                stats: cachedStats.stats,
                recentResults: cachedStats.recentResults,
                cached: true
            });
        }

        // Fallback to database
        const user = await User.findOne({ username }).select('-password');
        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get user's quiz statistics
        const userResults = await Results.find({ username }).sort({ createdAt: -1 });
        const recentResults = userResults.slice(0, 5); // Last 5 quizzes

        const responseData = {
            user,
            stats: {
                totalQuizzes: user.totalQuizzesTaken,
                averageScore: user.averageScore,
                bestScore: user.bestScore,
                recentQuizzes: recentResults.length
            },
            recentResults: recentResults.map(r => ({
                date: r.createdAt,
                score: r.percentage,
                points: r.points,
                totalQuestions: r.totalQuestions,
                timeTaken: r.timeTaken
            })),
            cached: false
        };

        // Cache the results
        await redisUtils.setUserProfile(username, user);
        await redisUtils.setUserStats(username, {
            stats: responseData.stats,
            recentResults: responseData.recentResults
        });

        res.json(responseData);
    } catch (error) {
        res.json({ error: error.message })
    }
}

/** Update user profile */
export async function updateUserProfile(req, res){
    try {
        const { username } = req.params;
        const updateData = req.body;
        
        // Remove sensitive fields
        delete updateData.password;
        delete updateData.userType;
        delete updateData._id;
        
        updateData.updatedAt = new Date();

        const user = await User.findOneAndUpdate(
            { username }, 
            updateData, 
            { new: true, select: '-password' }
        );
        
        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update Redis cache
        await redisUtils.setUserProfile(username, user);

        res.json({ msg: "Profile updated successfully", user });
    } catch (error) {
        res.json({ error: error.message })
    }
}

/** Get user's quiz history */
export async function getUserResults(req, res){
    try {
        const { username } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const results = await Results.find({ username })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Results.countDocuments({ username });

        const detailedResults = results.map(result => ({
            id: result._id,
            date: result.createdAt,
            score: result.percentage,
            points: result.points,
            totalQuestions: result.totalQuestions,
            correctAnswers: result.result.filter((answer, index) => 
                answer === result.correctAnswers[index]
            ).length,
            timeTaken: result.timeTaken,
            attempts: result.attempts,
            achievement: result.achived
        }));

        res.json({
            results: detailedResults,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            },
            summary: {
                totalQuizzes: total,
                averageScore: detailedResults.length > 0 
                    ? Math.round(detailedResults.reduce((sum, r) => sum + r.score, 0) / detailedResults.length)
                    : 0
            }
        });
    } catch (error) {
        res.json({ error: error.message })
    }
}