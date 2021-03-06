import { Components, registerComponent } from 'meteor/nova:lib';
import React, { PropTypes, Component } from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import Formsy from 'formsy-react';
import { Input } from 'formsy-react-components';
import { Button } from 'react-bootstrap';
import Cookie from 'react-cookie';
import Users from 'meteor/nova:users';
import { withCurrentUser, withMutation, withMessages } from 'meteor/nova:core';

class Newsletter extends Component {

  constructor(props, context) {
    super(props);
    this.subscribeEmail = this.subscribeEmail.bind(this);
    this.successCallbackSubscription = this.successCallbackSubscription.bind(this);
    this.dismissBanner = this.dismissBanner.bind(this);

    this.state = {
      showBanner: showBanner(props.currentUser)
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.currentUser) {
      this.setState({showBanner: showBanner(nextProps.currentUser)});
    }
  }

  subscribeEmail(data) {
    this.props.addEmailNewsletter({email: data.email}).then(result => {
      this.successCallbackSubscription(result);
    }).catch(error => {
      console.log(error);
      this.props.flash(error.message, "error");
    });
  }

  successCallbackSubscription(result) {
    this.props.flash(this.context.intl.formatMessage({id: "newsletter.success_message"}), "success");
    this.dismissBanner();
  }

  dismissBanner(e) {
    if (e && e.preventDefault) e.preventDefault();

    this.setState({showBanner: false});

    // set cookie to keep the banner dismissed persistently 
    Cookie.save('showBanner', "no");
  }

  renderButton() {
    return <Components.NewsletterButton
              label="newsletter.subscribe"
              mutationName="addUserNewsletter"
              successCallback={() => this.successCallbackSubscription()}
              user={this.props.currentUser}
            />
  }

  renderForm() {
    return (
      <Formsy.Form className="newsletter-form" onSubmit={this.subscribeEmail}>
        <Input
          name="email"
          value=""
          placeholder={this.context.intl.formatMessage({id: "newsletter.email"})}
          type="text"
          layout="elementOnly"
        />
        <Button className="newsletter-button" type="submit" bsStyle="primary"><FormattedMessage id="newsletter.subscribe"/></Button>
      </Formsy.Form>
    )
  }

  render() {
    return this.state.showBanner
      ? (
        <div className="newsletter">
          <h4 className="newsletter-tagline"><FormattedMessage id="newsletter.subscribe_prompt"/></h4>
          {this.props.currentUser ? this.renderButton() : this.renderForm()}
          <a onClick={this.dismissBanner} className="newsletter-close"><Components.Icon name="close"/></a>
        </div>
      ) : null;
  }
}

Newsletter.contextTypes = {
  actions: React.PropTypes.object,
  intl: intlShape
};

const mutationOptions = {
  name: 'addEmailNewsletter',
  args: {email: 'String'}
}

function showBanner (user) {
  return (
    // showBanner cookie either doesn't exist or is not set to "no"
    Cookie.load('showBanner') !== "no"
    // and showBanner user setting either doesn't exist or is set to true
    // && Users.getSetting(user, 'newsletter.showBanner', true)
    // and user is not subscribed to the newsletter already (setting either DNE or is not set to false)
    && !Users.getSetting(user, 'newsletter_subscribeToNewsletter', false)
  );
}

registerComponent('Newsletter', Newsletter, withMutation(mutationOptions), withCurrentUser, withMessages);
