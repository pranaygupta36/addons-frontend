/* @flow */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import SearchResult from 'amo/components/SearchResult';
import translate from 'core/i18n/translate';
import CardList from 'ui/components/CardList';

import './styles.scss';


type PropTypes = {|

|};

export default class CarouselBase extends React.Component {

  render() {
    return (
      <div className="Carousel" />
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
