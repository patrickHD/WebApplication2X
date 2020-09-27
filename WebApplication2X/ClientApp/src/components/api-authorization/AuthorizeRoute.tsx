import React, { FunctionComponent, useState, useEffect, useRef } from 'react'
import { Component } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { ApplicationPaths, QueryParameterNames } from './ApiAuthorizationConstants'
import authService from './AuthorizeService'

type AuthorizeRouteProps = {
    path: string,
    component: React.ReactType,
}

const AuthorizeRoute: FunctionComponent<AuthorizeRouteProps> = props => {
    var _subscription: any;
    const [state, setState] = useState({ ready: false, authenticated: false })

    const populateAuthenticationState = async () => {
        const authenticated = await authService.isAuthenticated();
        setState((os) => {
            return { ...os, ready: true, authenticated: authenticated }
        });
    }

    const authenticationChanged = async () => {
        setState((os) => {
            return { ...os, ready: false, authenticated: false }
        });
        await populateAuthenticationState();
    }

    useEffect(() => {
        _subscription = authService.subscribe(() => authenticationChanged());
        populateAuthenticationState();
        return () => authService.unsubscribe(_subscription)
    }, [])

    var link = document.createElement("a");
    link.href = props.path;
    const returnUrl = `${link.protocol}//${link.host}${link.pathname}${link.search}${link.hash}`;
    const redirectUrl = `${ApplicationPaths.Login}?${QueryParameterNames.ReturnUrl}=${encodeURIComponent(returnUrl)}`
    if (!state.ready) {
        return <div></div>;
    } else {
        const { component: Component, ...rest } = props;
        return <Route {...rest} render={(props) => {
            if (state.authenticated) {
                return <Component {...props} />;
            } else {
                return <Redirect to={redirectUrl} />;
            }
        }} />
    }
};

export default AuthorizeRoute;