import React, { useState, useEffect, Fragment } from 'react';
import { NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import authService from './AuthorizeService';
import { ApplicationPaths } from './ApiAuthorizationConstants';

export function LoginMenu() {
    const [state, setState] = useState({ isAuthenticated: false, userName: "" });

    useEffect(() => {
        var _subscription = authService.subscribe(() => populateState());
        populateState();
        return () => {
            authService.unsubscribe(_subscription);
        }
    }, [])

    async function populateState() {
        const [isAuthenticated, user] = await Promise.all([authService.isAuthenticated(), authService.getUser()])
        setState({
            isAuthenticated,
            userName: user && user.name
        });
    }

    function authenticatedView(userName: string, profilePath: string, logoutPath: any) {
        return (<Fragment>
            <NavItem>
                <NavLink tag={Link} className="text-dark" to={profilePath}> Hello {userName} </NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-dark" to={logoutPath}>Logout</NavLink>
            </NavItem>
        </Fragment>);

    }

    function anonymousView(registerPath: string, loginPath: string) {
        return (<Fragment>
            <NavItem>
                <NavLink tag={Link} className="text-dark" to={registerPath}>Register</NavLink>
            </NavItem>
            <NavItem>
                <NavLink tag={Link} className="text-dark" to={loginPath}>Login</NavLink>
            </NavItem>
        </Fragment>);
    }

    const { isAuthenticated, userName } = state;
    if (!isAuthenticated) {
        const registerPath = `${ApplicationPaths.Register}`;
        const loginPath = `${ApplicationPaths.Login}`;
        return anonymousView(registerPath, loginPath);
    } else {
        const profilePath = `${ApplicationPaths.Profile}`;
        const logoutPath = { pathname: `${ApplicationPaths.LogOut}`, state: { local: true } };
        return authenticatedView(userName, profilePath, logoutPath);
    }
}
