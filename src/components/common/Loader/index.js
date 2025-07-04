import './Loader.css';

const Loader = () => {
  return (
    <div className='conversation-message system'>
      <div className='message-bubble loading'>
        <span className='dot'></span>
        <span className='dot'></span>
        <span className='dot'></span>
      </div>
    </div>
  );
};

export default Loader;
