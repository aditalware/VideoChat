import {LOGIN_SUCCESS, REGISTER_SUCCESS} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = ({email, password}) => async (dispatch) => {
    if(!email || !password){
        return;
    }
    else{
        dispatch({type:LOGIN_SUCCESS,
        payload:{
            user:{
                  name:`user_${ID()}`,
                  uid:`id_${ID()}`,
                  email

              }}
        });

        dispatch(setUser(email,password));
    }
};

// AsyncStorage.clear();
export const setUser = (email, password) => async (dispatch) => {

    await AsyncStorage.setItem('@email',email),
    await AsyncStorage.setItem('@password',password)

};

// Load a user from async storage
export const loadUser = () => async (dispatch) => {
    const email=await AsyncStorage.getItem('@email');
    const password=await AsyncStorage.getItem('@password');

    if(email && password){
        dispatch(login(email,password));
    }
};

export function ID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}