import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useModalAccessibility } from './useModalAccessibility.js';

const ConfirmContext = createContext({ confirm: async () => false });

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '', resolve: null });
  const dialogRef = useRef(null);

  const confirm = (message) => {
    return new Promise((resolve) => {
      setState({ open: true, message, resolve });
    });
  };

  const handleClose = useCallback((result) => {
    if (state.resolve) state.resolve(result);
    setState({ open: false, message: '', resolve: null });
  }, [state.resolve]);

  const handleCancel = useCallback(() => handleClose(false), [handleClose]);

  useModalAccessibility(state.open, dialogRef, handleCancel);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="modal-overlay show">
          <div
            ref={dialogRef}
            className="modal confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            tabIndex="-1"
          >
            <div className="modal-header">
              <h3 id="confirm-dialog-title">Confirm Action</h3>
              <button className="modal-close" onClick={handleCancel} aria-label="Close confirmation dialog">x</button>
            </div>
            <div className="modal-body">
              <p className="confirm-message">{state.message}</p>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleClose(true)} className="btn btn-danger">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
