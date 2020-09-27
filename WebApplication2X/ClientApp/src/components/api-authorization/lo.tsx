import React, { FunctionComponent, useState, useEffect, useRef } from 'react'
import { Component } from 'react';
import authService from './AuthorizeService';
import { AuthenticationResultStatus } from './AuthorizeService';
import { QueryParameterNames, LogoutActions, ApplicationPaths } from './ApiAuthorizationConstants';
import { connect } from 'react-redux';

// The main responsibility of this component is to handle the user's logout process.
// This is the starting point for the logout process, which is usually initiated when a
// user clicks on the logout button on the LoginMenu component.

type LogoutProps = {
    action: any
}

const Logout: FunctionComponent<LogoutProps> = props => {
    const [state, setState] = useState({ message: "", isReady: false, authenticated: false });

    const logout = async (returnUrl: string) => {
        const state = { returnUrl };
        const isauthenticated = await authService.isAuthenticated();
        if (isauthenticated) {
            const result: any = await authService.signOut(state);
            switch (result.status) {
                case AuthenticationResultStatus.Redirect:
                    break;
                case AuthenticationResultStatus.Success:
                    await navigateToReturnUrl(returnUrl);
                    break;
                case AuthenticationResultStatus.Fail:
                    setState((os) => { return { ...os, message: result.message } });
                    break;
                default:
                    throw new Error("Invalid authentication result status.");
            }
        } else {
            setState((os) => { return { ...os, message: "You successfully logged out!" } });
        }
    }

    const processLogoutCallback = async () => {
        const url = window.location.href;
        const result: any = await authService.completeSignOut(url);
        switch (result.status) {
            case AuthenticationResultStatus.Redirect:
                // There should not be any redirects as the only time completeAuthentication finishes
                // is when we are doing a redirect sign in flow.
                throw new Error('Should not redirect.');
            case AuthenticationResultStatus.Success:
                await navigateToReturnUrl(getReturnUrl(result.state));
                break;
            case AuthenticationResultStatus.Fail:
                setState((os) => { return { ...os, message: result.message } });
                break;
            default:
                throw new Error("Invalid authentication result status.");
        }
    }

    const populateAuthenticationState = async () => {
        const authenticated = await authService.isAuthenticated();
        setState((os) => { return { ...os, isReady: true, authenticated } });
    }

    const getReturnUrl = (state?: any) => {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get(QueryParameterNames.ReturnUrl);
        if (fromQuery && !fromQuery.startsWith(`${window.location.origin}/`)) {
            // This is an extra check to prevent open redirects.
            throw new Error("Invalid return url. The return url needs to have the same origin as the current page.")
        }
        return (state && state.returnUrl) ||
            fromQuery ||
            `${window.location.origin}${ApplicationPaths.LoggedOut}`;
    }

    async function navigateToReturnUrl(returnUrl: string) {
        return window.location.replace(returnUrl);
    }

    useEffect(() => {
        const action = props.action;
        switch (action) {
            case LogoutActions.Logout:
                if (!!window.history.state.state.local) {
                    logout(getReturnUrl());
                } else {
                    // This prevents regular links to <app>/authentication/logout from triggering a logout
                    setState((os) => { return { ...os, isReady: true, message: "The logout was not initiated from within the page." } });
                }
                break;
            case LogoutActions.LogoutCallback:
                processLogoutCallback();
                break;
            case LogoutActions.LoggedOut:
                setState((os) => { return { ...os, isReady: true, message: "You successfully logged out!" } });
                break;
            default:
                throw new Error(`Invalid action '${action}'`);
        }
        populateAuthenticationState();
    }, []);

    const { isReady, message } = state;
    if (!isReady) {
        return <div></div>
    }
    if (!!message) {
        return (<div>{message}</div>);
    } else {
        const action = props.action;
        switch (action) {
            case LogoutActions.Logout:
                return (<div>Processing logout</div>);
            case LogoutActions.LogoutCallback:
                return (<div>Processing logout callback</div>);
            case LogoutActions.LoggedOut:
                return (<div>{message}</div>);
            default:
                throw new Error(`Invalid action '${action}'`);
        }
    }
}

export default connect()(Logout);