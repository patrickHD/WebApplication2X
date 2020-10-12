import React, { FunctionComponent, useState, useEffect } from 'react'
import { connect } from 'react-redux';
import authService from './AuthorizeService';
import { AuthenticationResultStatus } from './AuthorizeService';
import { LoginActions, QueryParameterNames, ApplicationPaths } from './ApiAuthorizationConstants';

type LoginProps = {
    action: any
}

const Login: FunctionComponent<LoginProps> = props => {
    const [state, setState] = useState({ message: "" });

    async function login(returnUrl: string) {
        const state = { returnUrl };
        const result: any = await authService.signIn(state);
        switch (result.status) {
            case AuthenticationResultStatus.Redirect:
                break;
            case AuthenticationResultStatus.Success:
                await navigateToReturnUrl(returnUrl);
                break;
            case AuthenticationResultStatus.Fail:
                setState({ message: result.message });
                break;
            default:
                throw new Error(`Invalid status result ${result.status}.`);
        }
    }

    async function processLoginCallback() {
        const url = window.location.href;
        const result: any = await authService.completeSignIn(url);
        switch (result.status) {
            case AuthenticationResultStatus.Redirect:
                // There should not be any redirects as the only time completeSignIn finishes
                // is when we are doing a redirect sign in flow.
                throw new Error('Should not redirect.');
            case AuthenticationResultStatus.Success:
                await navigateToReturnUrl(getReturnUrl(result.state));
                break;
            case AuthenticationResultStatus.Fail:
                setState({ message: result.message });
                break;
            default:
                throw new Error(`Invalid authentication result status '${result.status}'.`);
        }
    }

    function getReturnUrl(state?: any) {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get(QueryParameterNames.ReturnUrl);
        if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
            // This is an extra check to prevent open redirects.
            throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
        }
        return (state && state.returnUrl) || fromQuery || `${window.location.origin}/`;
    }

    function redirectToRegister() {
        redirectToApiAuthorizationPath(`${ApplicationPaths.IdentityRegisterPath}?${QueryParameterNames.ReturnUrl}=${encodeURI(ApplicationPaths.Login)}`);
    }

    function redirectToProfile() {
        redirectToApiAuthorizationPath(ApplicationPaths.IdentityManagePath);
    }

    function redirectToApiAuthorizationPath(apiAuthorizationPath: any) {
        const redirectUrl = `${window.location.origin}/${apiAuthorizationPath}`;
        // It's important that we do a replace here so that when the user hits the back arrow on the
        // browser they get sent back to where it was on the app instead of to an endpoint on this
        // component.
        window.location.replace(redirectUrl);
    }

    function navigateToReturnUrl(returnUrl: string) {
        // It's important that we do a replace here so that we remove the callback uri with the
        // fragment containing the tokens from the browser history.
        window.location.replace(returnUrl);
    }

    useEffect(() => {
        const action = props.action;
        switch (action) {
            case LoginActions.Login:
                login(getReturnUrl());
                break;
            case LoginActions.LoginCallback:
                processLoginCallback();
                break;
            case LoginActions.LoginFailed:
                const params = new URLSearchParams(window.location.search);
                const error: any = params.get(QueryParameterNames.Message);
                setState({ message: error });
                break;
            case LoginActions.Profile:
                redirectToProfile();
                break;
            case LoginActions.Register:
                redirectToRegister();
                break;
            default:
                throw new Error(`Invalid action '${action}'`);
        }
    }, [])

    const action = props.action;
    const { message } = state;

    if (!!message) {
        return <div>{message}</div>
    } else {
        switch (action) {
            case LoginActions.Login:
                return (<div>Processing login</div>);
            case LoginActions.LoginCallback:
                return (<div>Processing login callback</div>);
            case LoginActions.Profile:
            case LoginActions.Register:
                return (<div></div>);
            default:
                throw new Error(`Invalid action '${action}'`);
        }
    }
}

export default connect()(Login)