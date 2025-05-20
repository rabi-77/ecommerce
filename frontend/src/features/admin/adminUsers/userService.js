import api from '../../../apis/admin/api'

// Get all users with pagination and search
const getUsers = async (page, size, search) => {
    const response = await api.get('/users', { params: { page, size, search } })
    return response.data
}

// Toggle user block status
const toggleUserBlock = async (userId) => {
    const response = await api.patch(`/toggle-user-block/${userId}`)
    return response.data
}

export { getUsers, toggleUserBlock }
