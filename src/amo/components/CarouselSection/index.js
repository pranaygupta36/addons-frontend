/* @flow */
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';

import './styles.scss';


type PropTypes = {|
  children: any,
  linkTo?: Object | string,
  styleName: string,
|};

export class CarouselSectionBase extends React.Component {
  props: PropTypes;

  render() {
    const { children, linkTo, styleName } = this.props;

    return (
      <div
        className={classNames(
          'CarouselSection',
          `CarouselSection-styleName--${styleName}`,
        )}
      >
        {linkTo ? (
          <Link className="CarouselSection-link" to={linkTo}>{children}</Link>
        ) : children}
      </div>
    );
  }
}

// export const mapStateToProps = (state) => {
//   return {};
// }

export default compose(
  // connect(mapStateToProps),
  translate(),
)(CarouselSectionBase);
