import api from '../../../apis/admin/api'

const getUsers = async (page, size, search) => {
    const response = await api.get('/users', { params: { page, size, search } })
    return response.data
}

const toggleUserBlock = async (userId) => {
    const response = await api.patch(`/toggle-user-block/${userId}`)
    return response.data
}

export { getUsers, toggleUserBlock }
