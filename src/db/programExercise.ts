import {
    Sequelize,
    DataTypes,
    Model
} from 'sequelize'
import { DatabaseModel } from '../types/db'

export class ProgramWithExerciseModel extends DatabaseModel {
    id: number
    programID: number
    exerciseID: number
}

export default (sequelize: Sequelize) => {
    ProgramWithExerciseModel.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        programID: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'programs',
                key: 'id'
            }
        },
        exerciseID: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'exercises',
                key: 'id'
            }
        }
    }, {
        paranoid: true,
        timestamps: true,
        sequelize,
        modelName: 'programWithExercise',
        tableName: 'program_with_exercises'
    })

    return ProgramWithExerciseModel
} 