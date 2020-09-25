export function connectedComponentRegistrar(Class) {
    Class.instances = [];

    Class.WrappedComponent.prototype._componentDidMount =
        Class.WrappedComponent.prototype.componentDidMount || function () {};

    Class.WrappedComponent.prototype.componentDidMount = function () {
        Class.instances.push(this);
        this._componentDidMount();
    };

    Class.WrappedComponent.prototype._componentWillUnmount =
        Class.WrappedComponent.prototype.componentWillUnmount || function () {};

    Class.WrappedComponent.prototype.componentWillUnmount = function () {
        Class.instances = Class.instances.filter((inst) => inst !== this);
        this._componentWillUnmount();
    };
}
