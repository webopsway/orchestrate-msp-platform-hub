import { CreateUserData, UpdateUserData, User } from '../types/user';
import apiClient from './apiClient';

export const userService = {
  // Récupérer tous les utilisateurs (MSP admin privilege)
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data.data;
  },

  // Créer un utilisateur avec association organisation/équipe obligatoire
  async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post('/users', userData);
    return response.data.data;
  },

  // Mettre à jour un utilisateur
  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data.data;
  },

  // Supprimer un utilisateur
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  // Récupérer un utilisateur par ID
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  }
};
