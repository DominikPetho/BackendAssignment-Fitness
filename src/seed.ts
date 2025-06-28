import { models, sequelize } from './db'
import { USER_ROLE, EXERCISE_DIFFICULTY } from './utils/enums'

const { User, Program, Exercise } = models

const seed = async () => {
	try {
		// Sync database
		await sequelize.sync({ force: true })

		// Create users
		const admin = await User.create({
			name: 'Admin',
			surname: 'User',
			nickName: 'admin',
			email: 'admin@example.com',
			age: 30,
			role: USER_ROLE.ADMIN,
			password: 'admin123'
		})

		const user1 = await User.create({
			name: 'John',
			surname: 'Doe',
			nickName: 'johndoe',
			email: 'john@example.com',
			age: 25,
			role: USER_ROLE.USER,
			password: 'user123'
		})

		const user2 = await User.create({
			name: 'Jane',
			surname: 'Smith',
			nickName: 'janesmith',
			email: 'jane@example.com',
			age: 28,
			role: USER_ROLE.USER,
			password: 'user123'
		})

		// Create programs
		const program1 = await Program.create({
			name: 'Beginner Workout',
			description: 'A simple workout for beginners'
		})

		const program2 = await Program.create({
			name: 'Advanced Workout',
			description: 'A challenging workout for experienced users'
		})

		// Create exercises
		await Exercise.create({
			name: 'Push-ups',
			difficulty: EXERCISE_DIFFICULTY.EASY,
			programID: program1.id
		})

		await Exercise.create({
			name: 'Squats',
			difficulty: EXERCISE_DIFFICULTY.EASY,
			programID: program1.id
		})

		await Exercise.create({
			name: 'Pull-ups',
			difficulty: EXERCISE_DIFFICULTY.HARD,
			programID: program2.id
		})

		await Exercise.create({
			name: 'Burpees',
			difficulty: EXERCISE_DIFFICULTY.MEDIUM,
			programID: program2.id
		})

		console.log('Database seeded successfully!')
	} catch (error) {
		console.error('Error seeding database:', error)
	}
}

// Only close connection if this file is run directly
if (require.main === module) {
	seed().finally(() => sequelize.close())
} else {
	seed()
}
