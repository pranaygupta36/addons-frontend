/* @flow */
import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import ReactSlick from 'react-slick';
import { compose } from 'redux';

import CarouselSection from 'amo/components/CarouselSection';
import Link from 'amo/components/Link';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { visibleAddonType } from 'core/utils';
import Card from 'ui/components/Card';

// These are included in the repo via `react-slick`.
// eslint-disable-next-line import/no-extraneous-dependencies
import 'slick-carousel/slick/slick.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'slick-carousel/slick/slick-theme.css';
import './styles.scss';


type PropTypes = {|
  i18n: Object,
|};

export class CarouselBase extends React.Component {
  props: PropTypes;

  render() {
    const { i18n } = this.props;

    return (
      <Card className="Carousel">
        <ReactSlick
          autoplay
          autoplaySpeed={5000}
          centerMode
          infinite
          initialSlide={2}
          slidesToScroll={1}
          slidesToShow={1}
          variableWidth
        >
          <div>
            <CarouselSection
              linkTo={`/${visibleAddonType(ADDON_TYPE_EXTENSION)}/featured/`}
              styleName="featured-extensions"
            >
              {i18n.gettext('Featured extensions')}
            </CarouselSection>
          </div>
          <div>
            <CarouselSection
              linkTo="/collections/mozilla/dynamic-media-downloaders/"
              styleName="dynamic-media-downloaders"
            >
              {i18n.gettext('There are better ways to download media')}
            </CarouselSection>
          </div>
          <div>
            <CarouselSection
              linkTo="/collections/mozilla/privacy-matters/"
              styleName="privacy-matters"
            >
              {i18n.gettext(`From ad blockers to anti-trackers, here are some
                impressive privacy extensions`)}
            </CarouselSection>
          </div>
          <div>
            <CarouselSection
              linkTo={{
                pathname: '/search/',
                query: {
                  addonType: ADDON_TYPE_THEME,
                  sort: SEARCH_SORT_TOP_RATED,
                },
              }}
              styleName="top-rated-themes"
            >
              {i18n.gettext('Top-rated themes')}
            </CarouselSection>
          </div>
        </ReactSlick>
      </Card>
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
