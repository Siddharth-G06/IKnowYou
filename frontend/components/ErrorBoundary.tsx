'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          color: 'var(--text-primary)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-elevated)',
            padding: '2.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            maxWidth: '480px',
            width: '100%'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--destructive)',
              opacity: 0.1,
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              position: 'relative'
            }}>
              <AlertTriangle 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'var(--destructive)',
                  opacity: 1
                }}
                size={32}
              />
            </div>
            
            <h2 style={{
              fontSize: '24px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              Something went wrong
            </h2>
            
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
              lineHeight: 1.5
            }}>
              Don&apos;t worry, your data is safe. An unexpected error occurred in the application interface.
            </p>
            
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--amber)',
                color: '#000',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RefreshCcw size={16} />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
