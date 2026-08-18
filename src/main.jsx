import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      // TODO: Replace these placeholders with your actual AWS Cognito values
      userPoolId: 'ap-south-1_el4qg9QNc',
      userPoolClientId: '5tkdsa8lm7s3o0v6aa2avbuq1m',
      identityPoolId: '', // Leave blank if not using Identity Pool
      loginWith: {
        oauth: {
          domain: 'ap-south-1el4qg9qnc.auth.ap-south-1.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['http://localhost:5173/'],
          redirectSignOut: ['http://localhost:5173/'],
          responseType: 'code',
        }
      }
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
