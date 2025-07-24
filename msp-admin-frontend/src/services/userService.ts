import apiClient from './apiClient'

// Interfaces pour les types
interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  is_msp_admin: boolean
  default_organization_id?: string
  default_team_id?: string
  organization?: { name: string }
  team?: { name: string }
  metadata?: any
  created_at?: string
  updated_at?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  count?: number
}

export class UserService {

  /**
   * Récupérer tous les utilisateurs
   */
  static async getAll(): Promise<ApiResponse<User[]>> {
    try {
      // Pour le développement, s'assurer qu'on a un token
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem('auth_token', 'dev')
      }

      const response = await apiClient.get('/users')
      return response.data
    } catch (error: any) {
      console.error('Error fetching users:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors de la récupération des utilisateurs'
      }
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  static async getById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get(`/users/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching user:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors de la récupération de l\'utilisateur'
      }
    }
  }

  /**
   * Créer un nouvel utilisateur
   */
  static async create(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post('/users', userData)
      return response.data
    } catch (error: any) {
      console.error('Error creating user:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors de la création de l\'utilisateur'
      }
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async update(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put(`/users/${id}`, userData)
      return response.data
    } catch (error: any) {
      console.error('Error updating user:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors de la mise à jour de l\'utilisateur'
      }
    }
  }

  /**
   * Supprimer un utilisateur
   */
  static async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/users/${id}`)
      return response.data
    } catch (error: any) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors de la suppression de l\'utilisateur'
      }
    }
  }

  /**
   * Vérifier la santé de l'API
   */
  static async checkHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/health')
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('Error checking API health:', error)
      return {
        success: false,
        error: error.message || 'API non accessible'
      }
    }
  }
}
