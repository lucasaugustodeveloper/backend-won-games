import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import Wrapper, { A } from './Wrapper';

import messages from './messages.json';

defineMessages(messages);

function LeftMenuFooter() {
  return (
    <Wrapper>
      <div className="poweredBy">
        <FormattedMessage
          id={messages.poweredBy.id}
          defaultMessage={messages.poweredBy.defaultMessage}
          key="poweredBy"
        />
        <A key="website" href="https://github.com/laugustofrontend/backend-won-games" target="_blank" rel="noopener noreferrer">
          React Avançado
        </A>
      </div>
    </Wrapper>
  );
}
export default LeftMenuFooter;
