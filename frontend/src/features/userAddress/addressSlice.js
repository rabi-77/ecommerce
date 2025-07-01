import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllAddresses, addAddress, updateAddress, deleteAddress ,setDefaultAddress} from "./addressService";

export const getAllAddressesThunk= createAsyncThunk(
    "address/getAllAddresses",
    async (__dirname,{rejectWithValue})=>{
        try {
            const response= await getAllAddresses()
            return response
        } catch (error) {
            return rejectWithValue(error?.message || "Failed to get addresses")
        }
    }
)

export const addAddressThunk= createAsyncThunk(
    "address/addAddress",
    async (address,{rejectWithValue})=>{
        try {
            const response= await addAddress(address)
            return response
        } catch (error) {
            return rejectWithValue(error?.message || "Failed to add address")
        }
    }
)

export const updateAddressThunk= createAsyncThunk(
    "address/updateAddress",
    async ({addressId,address },{rejectWithValue})=>{
        try {
            const response= await updateAddress(addressId,address)
            return response
        } catch (error) {
            return rejectWithValue(error?.message || "Failed to update address")
        }
    }
)

export const deleteAddressThunk= createAsyncThunk(
    "address/deleteAddress",
    async (addressId,{rejectWithValue})=>{
        try {
            const response= await deleteAddress(addressId)
            return response
        } catch (error) {
            return rejectWithValue(error?.message || "Failed to delete address")
        }
    }
)

export const setDefaultAddressThunk= createAsyncThunk(
    "address/setDefaultAddress",
    async (addressId,{rejectWithValue})=>{
        try {
            const response= await setDefaultAddress(addressId)
            
            return response
        } catch (error) {
            
            return rejectWithValue(error?.message || "Failed to set default address")
        }
    }
)

const addressSlice= createSlice({
    name:"address",
    initialState:{
        addresses:[],
        addressLoading:false,
        addressError:null,
        addressSuccess:false,
    },
    reducers:{
        
    },
    extraReducers:(builder)=>{
        builder
        .addCase(getAllAddressesThunk.pending,(state)=>{
            state.addressLoading=true
            state.addressError=null
        })
        .addCase(getAllAddressesThunk.fulfilled,(state,action)=>{
            state.addressError=null
            state.addressLoading=false
            state.addressSuccess=true
            state.addresses=action.payload.addresses
        })
        .addCase(getAllAddressesThunk.rejected,(state,action)=>{
            state.addressLoading=false
            state.addressError=action.payload
        })

        .addCase(addAddressThunk.pending,(state)=>{
            state.addressLoading=true
            state.addressError=null
        })
        .addCase(addAddressThunk.fulfilled,(state,action)=>{
            state.addressError=null
            state.addressLoading=false
            state.addressSuccess=true
            state.addresses.push(action.payload.address)
        })
        .addCase(addAddressThunk.rejected,(state,action)=>{
            state.addressLoading=false
            state.addressError=action.payload
        })

        .addCase(updateAddressThunk.pending,(state)=>{
            state.addressLoading=true
            state.addressError=null
        })
        .addCase(updateAddressThunk.fulfilled,(state,action)=>{
            state.addressError=null
            state.addressLoading=false
            state.addressSuccess=true
            if(action.payload.address){
                state.addresses=state.addresses.map((address)=>{
                    if(address._id===action.payload.address._id){
                        return action.payload.address
                    }
                    return address
                })
            }
        })
        .addCase(updateAddressThunk.rejected,(state,action)=>{
            state.addressLoading=false
            state.addressError=action.payload
        })

        .addCase(deleteAddressThunk.pending,(state)=>{
            state.addressLoading=true
            state.addressError=null
        })
        .addCase(deleteAddressThunk.fulfilled,(state,action)=>{
            state.addressError=null
            state.addressLoading=false
            state.addressSuccess=true
            state.addresses=state.addresses.filter((address)=>address._id!==action.payload.addressId)
        })
        .addCase(deleteAddressThunk.rejected,(state,action)=>{
            state.addressLoading=false
            state.addressError=action.payload
        })

        .addCase(setDefaultAddressThunk.pending,(state)=>{
            state.addressLoading=true
            state.addressError=null
        })
        .addCase(setDefaultAddressThunk.fulfilled,(state,action)=>{
            state.addressError=null
            state.addressLoading=false
            state.addressSuccess=true
            if (action.payload.addresses) {
                state.addresses = action.payload.addresses;
            }
        })
        .addCase(setDefaultAddressThunk.rejected,(state,action)=>{
            state.addressLoading=false
            state.addressError=action.payload
        })  
    }
})

export default addressSlice.reducer
