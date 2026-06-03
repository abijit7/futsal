import { createContext, useContext, useState } from 'react';

const ConfirmContext = createContext({ confirm: async () => false });

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '', resolve: null });

  const confirm = (message) => {
    return new Promise((resolve) => {
      setState({ open: true, message, resolve });
    });
  };

  const handleClose = (result) => {
    if (state.resolve) state.resolve(result);
    setState({ open: false, message: '', resolve: null });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <div className={`modal-overlay ${state.open ? 'show' : ''}`}>
        <div
          className="modal"
          style={{ maxWidth: 380 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="modal-header">
            <h3 id="confirm-dialog-title">Confirm Action</h3>
            <button className="modal-close" onClick={() => handleClose(false)} aria-label="Close confirmation dialog">✕</button>
          </div>
          <div className="modal-body">
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>{state.message}</p>
          </div>
          <div className="modal-footer">
            <button onClick={() => handleClose(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={() => handleClose(true)} className="btn btn-danger">Confirm</button>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
