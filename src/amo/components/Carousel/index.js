/* @flow */
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import Slider from 'react-slick';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';

import './styles.scss';


type PropTypes = {|

|};

export class CarouselBase extends React.Component {
  props: PropTypes;

  render() {
    return (
      <div className="Carousel">
        <Slider
          dots
          infinite
          slidesToScroll={1}
          slidesToShow={2}
          speed={500}
        >
          <div>
            <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`}>
              FEATURED ADDONS
            </Link>
          </div>
          <div>
            <Link to={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/`}>
              JUST ADDONS
            </Link>
          </div>
          <div>
            <Link to={`/${visibleAddonType(ADDON_TYPE_THEME)}/`}>
              JUST THEMES
            </Link>
          </div>
        </Slider>
      </div>
    );
  }
}

export const mapStateToProps = (state) => {
  return {};
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(CarouselBase);
