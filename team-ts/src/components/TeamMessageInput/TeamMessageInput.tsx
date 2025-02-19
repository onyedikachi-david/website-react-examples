import { useCallback, useState } from 'react';
import { ImageDropzone } from 'react-file-utils';
import { Attachment, logChatPromiseExecution, MessageResponse, UserResponse } from 'stream-chat';
import {
  ChatAutoComplete,
  EmojiPicker,
  MessageInputProps,
  StreamMessage,
  UploadsPreview,
  useChannelContext,
  useChatContext,
  useMessageInput,
} from 'stream-chat-react';

import './TeamMessageInput.css';

import { TeamTypingIndicator } from '../TeamTypingIndicator/TeamTypingIndicator';

import {
  BoldIcon,
  CodeSnippet,
  ItalicsIcon,
  LightningBoltSmall,
  SendButton,
  SmileyFace,
  StrikeThroughIcon,
} from '../../assets';

import type {
  TeamAttachmentType,
  TeamChannelType,
  TeamCommandType,
  TeamEventType,
  TeamMessageType,
  TeamReactionType,
  TeamUserType,
} from '../../App';

export type MessageToOverride = {
  attachments: Attachment[];
  mentioned_users: UserResponse[];
  text: string;
  parent?: StreamMessage;
};

type Props = MessageInputProps & {
  pinsOpen: boolean;
};

export const TeamMessageInput: React.FC<Props> = (props) => {
  const {
    additionalTextareaProps,
    autocompleteTriggers,
    disabled,
    grow,
    maxRows,
    pinsOpen,
  } = props;

  const {
    acceptedFiles,
    channel,
    maxNumberOfFiles,
    multipleUploads,
    sendMessage,
    thread,
  } = useChannelContext<
    TeamAttachmentType,
    TeamChannelType,
    TeamCommandType,
    TeamEventType,
    TeamMessageType,
    TeamReactionType,
    TeamUserType
  >();

  const { client } = useChatContext<
    TeamAttachmentType,
    TeamChannelType,
    TeamCommandType,
    TeamEventType,
    TeamMessageType,
    TeamReactionType,
    TeamUserType
  >();

  const [boldState, setBoldState] = useState(false);
  const [codeState, setCodeState] = useState(false);
  const [giphyState, setGiphyState] = useState(false);
  const [italicState, setItalicState] = useState(false);
  const [strikeThroughState, setStrikeThroughState] = useState(false);

  const resetIconState = () => {
    setBoldState(false);
    setCodeState(false);
    setItalicState(false);
    setStrikeThroughState(false);
  };

  const getPlaceholder = () => {
    if (channel.type === 'team') {
      return `#${channel?.data?.name || channel?.data?.id || 'random'}`;
    }

    const members = Object.values(channel.state.members).filter(
      ({ user }) => user?.id !== client.userID,
    );

    if (!members.length || members.length === 1) {
      return members[0]?.user?.name || members[0]?.user?.id || 'Johnny Blaze';
    }

    return 'the group';
  };

  const overrideSubmitHandler = (message: MessageToOverride) => {
    let updatedMessage = {
      attachments: message.attachments,
      mentioned_users: message.mentioned_users,
      parent_id: message.parent?.id,
      parent: message.parent as MessageResponse,
      text: message.text,
    };

    if (message?.attachments?.length && message?.text?.startsWith('/giphy')) {
      const updatedText = message.text.replace('/giphy', '');
      updatedMessage = { ...updatedMessage, text: updatedText };
    }

    if (giphyState) {
      const updatedText = `/giphy ${message.text}`;
      updatedMessage = { ...updatedMessage, text: updatedText };
    } else {
      if (boldState && !message.text?.startsWith('**')) {
        const updatedText = `**${message.text}**`;
        updatedMessage = { ...updatedMessage, text: updatedText };
      }

      if (codeState && !message.text?.startsWith('`')) {
        const updatedText = `\`${message.text}\``;
        updatedMessage = { ...updatedMessage, text: updatedText };
      }

      if (italicState && !message?.text?.startsWith('*')) {
        const updatedText = `*${message.text}*`;
        updatedMessage = { ...updatedMessage, text: updatedText };
      }

      if (strikeThroughState && !message.text?.startsWith('~~')) {
        const updatedText = `~~${message.text}~~`;
        updatedMessage = { ...updatedMessage, text: updatedText };
      }
    }

    if (sendMessage) {
      const sendMessagePromise = sendMessage(updatedMessage);
      logChatPromiseExecution(sendMessagePromise, 'send message');
    }

    setGiphyState(false);
    resetIconState();
  };

  const messageInput = useMessageInput<
    TeamAttachmentType,
    TeamChannelType,
    TeamCommandType,
    TeamEventType,
    TeamMessageType,
    TeamReactionType,
    TeamUserType
  >({ ...props, overrideSubmitHandler });

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const { value } = event.target;

      const deletePressed =
        event.nativeEvent instanceof InputEvent &&
        event.nativeEvent.inputType === 'deleteContentBackward'
          ? true
          : false;

      if (messageInput.text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (!giphyState && messageInput.text.startsWith('/giphy') && !messageInput.numberOfUploads) {
        event.target.value = value.replace('/giphy', '');
        setGiphyState(true);
      }

      if (boldState) {
        if (deletePressed) {
          event.target.value = `${value.slice(0, value.length - 2)}**`;
        } else {
          event.target.value = `**${value.replace(/\**/g, '')}**`;
        }
      } else if (codeState) {
        if (deletePressed) {
          event.target.value = `${value.slice(0, value.length - 1)}\``;
        } else {
          event.target.value = `\`${value.replace(/`/g, '')}\``;
        }
      } else if (italicState) {
        if (deletePressed) {
          event.target.value = `${value.slice(0, value.length - 1)}*`;
        } else {
          event.target.value = `*${value.replace(/\*/g, '')}*`;
        }
      } else if (strikeThroughState) {
        if (deletePressed) {
          event.target.value = `${value.slice(0, value.length - 2)}~~`;
        } else {
          event.target.value = `~~${value.replace(/~~/g, '')}~~`;
        }
      }

      messageInput.handleChange(event);
    },
    [boldState, codeState, giphyState, italicState, messageInput, strikeThroughState],
  );

  const GiphyIcon = () => (
    <div className='giphy-icon__wrapper'>
      <LightningBoltSmall />
      <p className='giphy-icon__text'>GIPHY</p>
    </div>
  );

  return (
    <div className={`team-message-input__wrapper ${(!!thread || pinsOpen) && 'thread-open'}`}>
      <ImageDropzone
        accept={acceptedFiles}
        handleFiles={messageInput.uploadNewFiles}
        multiple={multipleUploads}
        disabled={
          (maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= maxNumberOfFiles) ||
          giphyState
        }
      >
        <div className='team-message-input__input'>
          <div className='team-message-input__top'>
            {giphyState && !messageInput.numberOfUploads && <GiphyIcon />}
            <UploadsPreview {...messageInput} />
            <ChatAutoComplete
              commands={messageInput.getCommands()}
              innerRef={messageInput.textareaRef}
              handleSubmit={messageInput.handleSubmit}
              onSelectItem={messageInput.onSelectItem}
              onChange={onChange}
              value={messageInput.text}
              rows={1}
              maxRows={maxRows}
              placeholder={`Message ${getPlaceholder()}`}
              onPaste={messageInput.onPaste}
              triggers={autocompleteTriggers}
              grow={grow}
              disabled={disabled}
              additionalTextareaProps={{
                ...additionalTextareaProps,
              }}
            />
            <div
              className='team-message-input__button'
              role='button'
              aria-roledescription='button'
              onClick={messageInput.handleSubmit}
            >
              <SendButton />
            </div>
          </div>
          <div className='team-message-input__bottom'>
            <div className='team-message-input__icons'>
              <SmileyFace openEmojiPicker={messageInput.openEmojiPicker} />
              <div className='icon-divider'></div>
              <BoldIcon {...{ boldState, resetIconState, setBoldState }} />
              <ItalicsIcon {...{ italicState, resetIconState, setItalicState }} />
              <StrikeThroughIcon
                {...{
                  resetIconState,
                  strikeThroughState,
                  setStrikeThroughState,
                }}
              />
              <CodeSnippet {...{ codeState, resetIconState, setCodeState }} />
            </div>
          </div>
        </div>
      </ImageDropzone>
      <TeamTypingIndicator type='input' />
      <EmojiPicker {...messageInput} />
    </div>
  );
};
