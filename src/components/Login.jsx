import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LoginUser, reset } from '../features/authSlice';
import pm_logo from '../Images/logoproject.png';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import '../login.css';
// import '../index.css'; // or wherever you put @tailwind directives
import '../tailwind.css'; // Your file with @tailwind directives

import logo from "../logocmt.png";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
useEffect(() => {
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
  return () => {
    document.head.removeChild(fontLink);
  };
}, []);

//     useEffect(() => {
//     const fontLink = document.createElement('link');
//     fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
//     fontLink.rel = 'stylesheet';
//     document.head.appendChild(fontLink);

//     return () => {
//       document.head.removeChild(fontLink);
//     };
//   }, []);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isError, isSuccess, isLoading, message } = useSelector(state => state.auth);

    const Auth = e => {
        e.preventDefault();
        dispatch(LoginUser({ email, password }));
    };

    useEffect(() => {
        if (user && isSuccess) {
            navigate('/dashboard');
        }
        dispatch(reset());
    }, [user, isSuccess, dispatch, navigate]);

    return (
        // <div className="login-page-container">
        //     <div className="login-form-section">
        //         <div className="login-box">
        //             <div className="text-center mb-5">
        //                 <img src={pm_logo} alt="pm Logo" height={130} className="mb-3" />
                      
        //             </div>
        //             <form onSubmit={Auth}>
        //                 <div className="form-group">
        //                     <label htmlFor="email" style={{ color: 'white',fontSize:'16px' }}>Email</label>
        //                     <InputText type="text" className="w-full mb-3" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        //                 </div>
        //                 <div className="form-group">
        //                     <label htmlFor="password" style={{ color: 'white',fontSize:'16px' }}>Κωδικός Πρόσβασης</label>
        //                     <InputText type="password" className="w-full mb-3" value={password} onChange={e => setPassword(e.target.value)} placeholder="Κωδικός Πρόσβασης" />
        //                 </div>
        //                 <Button type="submit" label={isLoading ? "Loading..." : "Είσοδος"} icon="pi pi-sign-in" className="w-full" />
                       
        //             </form>
        //             <h6 style={{ color: 'white' ,paddingTop:'10px'}}>Powered by</h6>
        //             <img src={logo} alt="cmt Logo" height={45} className="mb-3" />
        //             {isError && <p className="error-message">{message}</p>}
                    
        //         </div>
        //     </div>
        //     <div className="login-gif-section visible-gif">
        //     </div>
        // </div>


    // <div id="login-screen" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">

        
    //     <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
    //         <div class="text-center mb-6">
    //             <div className="text-center mb-5">
    //                 <img src={pm_logo} alt="pm Logo" height={10} className="mb-3" />
                      
    //            </div>
    //             <h1 class="text-3xl font-bold text-gray-800">Executive Dashboard</h1>
    //             <p class="text-gray-600 mt-2">Sign in to access your project analytics</p>
    //         </div>
                

    //         <form onSubmit={Auth} id="login-form" class="space-y-6">
    //             <div>
    //                 <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
    //                 <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required/>
    //             {/* <InputText type="text" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /> */}

    //             </div>
                
    //             <div>
    //                 <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
    //                 <input type="password" id="password" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={password} onChange={e => setPassword(e.target.value)} placeholder="Κωδικός Πρόσβασης" required/>
    //              {/* <InputText type="password"class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"  value={password} onChange={e => setPassword(e.target.value)} placeholder="Κωδικός Πρόσβασης" /> */}

    //             </div>
                
    //             <div>
    //                 <button style={{backgroundColor:"#143b68"}} type="submit"className="w-full text-white font-medium py-2 px-4 rounded-md transition duration-300 ease-in-out" >
    //                     Sign In
    //                 </button>
    //             </div>
                
    //         </form>
    //            <h6 style={{ color: 'black' ,paddingTop:'5px'}} className='text-center mb-5 text-xs text-gray-500 mt-1'>Powered by</h6>
    //             <img src={logo} alt="cmt Logo" height={10} className="text-center mb-5" /> 
    //     </div>
    // </div>
<div id="login-screen" style={{backgroundColor:"#3730a3"}} className="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-blue-600 tw-to-indigo-800 tw-p-4">
  <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-p-8 tw-w-full tw-max-w-md">
    <div className="tw-text-center tw-mb-6">
      <div className="tw-text-center tw-mb-5">
        <img src={pm_logo} alt="pm Logo" height={150} className="tw-mb-3" />
      </div>
      <h1 className="tw-text-3xl tw-font-bold tw-text-gray-800">Executive Dashboard</h1>
      <p className="tw-text-gray-600 tw-mt-2">Sign in to access your project analytics</p>
    </div>

    <form onSubmit={Auth} id="login-form" className="tw-space-y-6">
      <div>
        <label htmlFor="email" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Email</label>
        <input
          type="email"
          id="email"
          className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Password</label>
        <input
          type="password"
          id="password"
          className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-md focus:tw-ring-2 focus:tw-ring-blue-500 focus:tw-border-blue-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Κωδικός Πρόσβασης"
          required
        />
      </div>

      <div>
        <button
          type="submit"
          className="tw-w-full tw-text-white tw-font-medium tw-py-2 tw-px-4 tw-rounded-md tw-transition tw-duration-300 tw-ease-in-out"
          style={{ backgroundColor: "#143b68" }}
        >
          Sign In
        </button>
      </div>
    </form>
<div className="tw-text-center tw-mb-5">
    <h6 style={{ color: 'black', paddingTop: '5px' }} className="tw-text-center tw-mb-5 tw-text-xs tw-text-gray-500 tw-mt-1">Powered by</h6>
    <img src={logo} alt="cmt Logo" height={60} className="" />
    </div>
  </div>
</div>



    );
};

export default Login;
