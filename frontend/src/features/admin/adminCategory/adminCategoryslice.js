import {createSlice,createAsyncThunk} from '@reduxjs/toolkit'
import {getCategories,addCategory,editCategory,deleteCategory,toggleCategoryListing} from './adminCategoryService'

export const getCategoryThunk=createAsyncThunk(
    'category/getCategories',
    async ({page,size,search},{rejectWithValue})=>{
        try{
            const response= await getCategories(page,size,search)
            return response
        }catch(err){
            return rejectWithValue(err.response?.data.message || 'failed to fetch categories')
        }
    }
)

export const addCategoryThunk= createAsyncThunk(
    'category/addCategory',
    async(categoryData,{rejectWithValue})=>{
        try{
        const response= await addCategory(categoryData)
        return response
        }catch(err){
            return rejectWithValue(err.response?.data.message || 'adding failed')
        }
    }
)

export const editCategoryThunk= createAsyncThunk(
    'category/editcategory',
    async({id,categoryData},{rejectWithValue})=>{
        try{
            console.log('thunk');
            
            const response= await editCategory(id,categoryData)
            return response
        }catch(err){
            return rejectWithValue(err.response?.data.message || 'editing failed')
        }
    }
)

export const deleteCategoryThunk=createAsyncThunk(
    'category/deletecategory',
    async(id,{rejectWithValue})=>{
        try{
        const response = await deleteCategory(id)
        return id
        }catch(err){
            return rejectWithValue(err.response?.data.message || 'deletion failed for some reason, please check it')
        }
    }
)

export const toggleCategoryListingThunk = createAsyncThunk(
    "category/toggleListing",
    async (id, { rejectWithValue }) => {
        try {
            const response = await toggleCategoryListing(id);
            return response.category;
        } catch (err) {
            return rejectWithValue(
                err.response?.data.message || "Failed to toggle category listing"
            );
        }
    }
)

const categorySlice= createSlice({
    name:'category',
    initialState:{
        error:null,
        loading:false,
        categories:[],
        total:0,
        pages:1,
        size:10
    },
    reducers:{},
    extraReducers:(builder)=>{
        builder.addCase(getCategoryThunk.pending,(state)=>{
            state.loading=true
            state.error=null
        })
        .addCase(getCategoryThunk.fulfilled,(state,action)=>{
            state.error=null
            state.loading=false
            state.categories=action.payload.categories
            state.pages=action.payload.pages
            state.size=action.payload.size
            state.total=action.payload.total
        })
        .addCase(getCategoryThunk.rejected,(state,action)=>{
            state.loading = false;
            state.error = action.payload;
        })
        .addCase(addCategoryThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(addCategoryThunk.fulfilled, (state, action) => {
            state.loading = false;
            // state.categories.push(action.payload);
            state.categories = [action.payload, ...state.categories];
            state.total += 1;
          })
          .addCase(addCategoryThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          })
          .addCase(editCategoryThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(editCategoryThunk.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.categories.findIndex((cat) => cat._id === action.payload._id);
            if (index !== -1) {
              state.categories[index] = action.payload;
            }
          })
          .addCase(editCategoryThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          })
          .addCase(deleteCategoryThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.categories = state.categories.filter((cat) => cat._id !== action.payload);
            state.total -= 1;
          })
          .addCase(deleteCategoryThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          })
          .addCase(toggleCategoryListingThunk.pending, (state) => {
            state.loading = true;
            state.error = false;
          })
          .addCase(toggleCategoryListingThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.error = null;
            // Update the category in the state
            state.categories = state.categories.map(category => 
              category._id === action.payload._id ? action.payload : category
            );
          })
          .addCase(toggleCategoryListingThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
          });
    }
})

export default categorySlice.reducer