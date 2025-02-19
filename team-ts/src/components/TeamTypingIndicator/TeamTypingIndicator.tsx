import { useChannelContext } from 'stream-chat-react';

import './TeamTypingIndicator.css';

import type {
  TeamAttachmentType,
  TeamChannelType,
  TeamCommandType,
  TeamEventType,
  TeamMessageType,
  TeamReactionType,
  TeamUserType,
} from '../../App';

export const TeamTypingIndicator: React.FC<{ type: string }> = (props) => {
  const { type } = props;

  const { client, typing } = useChannelContext<
    TeamAttachmentType,
    TeamChannelType,
    TeamCommandType,
    TeamEventType,
    TeamMessageType,
    TeamReactionType,
    TeamUserType
  >();

  if (!client || !typing) return null;

  if (type === 'list') {
    return (
      <div className='typing-indicator__list'>
        <div className='dots'>
          <div className='dot' />
          <div className='dot' />
          <div className='dot' />
        </div>
      </div>
    );
  }

  const users = Object.values(typing)
    .filter(({ user }) => user?.id !== client.user?.id)
    .map(({ user }) => user?.name || user?.id);

  if (!users.length) return null;

  let text = 'Someone is typing';

  if (users.length === 1) {
    text = `${users[0]} is typing`;
  } else if (users.length === 2) {
    text = `${users[0]} and ${users[1]} are typing`;
  } else if (users.length > 2) {
    text = `${users[0]} and ${users.length - 1} more are typing`;
  }

  return (
    <div className='typing-indicator__input'>
      <div className='dots'>
        <div className='dot' />
        <div className='dot' />
        <div className='dot' />
      </div>
      <div className='typing-indicator__input__text'>{text}</div>
    </div>
  );
};
