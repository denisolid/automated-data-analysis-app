import mongoose from 'mongoose';

export const createDynamicModel = (fields) => {
  const modelName = 'DynamicRecord'; // Определите имя модели
  const schemaFields = {};
  fields.forEach((field) => {
    schemaFields[field] = { type: String }; // Задаем тип String для всех полей
  });

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName]; // Возвращаем существующую модель
  }

  const dynamicSchema = new mongoose.Schema(schemaFields);
  return mongoose.model('DynamicRecord', dynamicSchema);
};
