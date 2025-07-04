import { useState } from 'react';
import './ConfirmDialog.css';
import Loader from '../Loader';

const ConfirmDialog = ({
  title,
  description,
  dialogBox,
  setDialogBox,
  confirmClicked,
  isOk = false,
  buttonClass = '',
  headerClass = '',
  cancelPlan = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const confirmHandler = async () => {
    setIsLoading(true);

    if (typeof confirmClicked === 'function') {
      await confirmClicked();
      setIsLoading(false);
      setDialogBox(false);
    }
  };

  if (!dialogBox) return null;

  return (
    <div className='dialog-overlay' onClick={() => setDialogBox(false)}>
      <div className='dialog-content bg-white' onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <div className='loader-container'>
            <Loader />
          </div>
        ) : (
          <>
            <div className={`dialog-header ${headerClass}`}>
              <h2 className='dialog-title'>{title}</h2>
              <div
                className='dialog-description'
                dangerouslySetInnerHTML={{ __html: `<div>${description}<br/><br/></div>` }}
              />
            </div>
            <div className='dialog-footer'>
              {!isOk && (
                <button
                  className={`btn btn-secondary ${buttonClass}`}
                  type='button'
                  onClick={() => setDialogBox(false)}
                >
                  Not Now
                </button>
              )}
              <button
                className={`btn ${cancelPlan ? 'btn-danger' : 'btn-primary'} ${buttonClass}`}
                type='button'
                onClick={confirmHandler}
              >
                {cancelPlan ? 'Cancel Plan' : isOk ? 'OK' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmDialog;
