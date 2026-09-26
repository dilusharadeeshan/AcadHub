import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    console.error('The page could not be rendered.');
  }
  render() {
    return this.state.failed ? (
      <main className="center-page">
        <div className="panel">
          <h1>Something interrupted this page.</h1>
          <p>Please reload to reopen your workspace.</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </main>
    ) : (
      this.props.children
    );
  }
}
