import config from 'config';
import { mount, shallow } from 'enzyme';
import React from 'react';
import { compose } from 'redux';
import UAParser from 'ua-parser-js';

import createStore from 'amo/store';
import { setInstallState } from 'core/actions/installations';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLOSE_INFO,
  DISABLED,
  DOWNLOAD_FAILED,
  DOWNLOAD_PROGRESS,
  ENABLED,
  ERROR,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_CATEGORY,
  INSTALL_CANCELLED,
  INSTALL_FAILED,
  INSTALLED,
  INSTALLING,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
  SET_ENABLE_NOT_AVAILABLE,
  SHOW_INFO,
  START_DOWNLOAD,
  THEME_INSTALL,
  THEME_PREVIEW,
  THEME_RESET_PREVIEW,
  TRACKING_TYPE_EXTENSION,
  TRACKING_TYPE_THEME,
  UNINSTALL_CATEGORY,
  UNINSTALLED,
  UNINSTALLING,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import {
  createFakeAddon, fakeAddon, fakeTheme,
} from 'tests/unit/amo/helpers';
import {
  getFakeAddonManagerWrapper,
  sampleUserAgentParsed,
  shallowUntilTarget,
  userAgentsByPlatform,
} from 'tests/unit/helpers';
import * as installAddon from 'core/installAddon';
import * as themePreview from 'core/themePreview';

const {
  WithInstallHelpers,
  installTheme,
  makeProgressHandler,
  makeMapDispatchToProps,
  mapStateToProps,
  withInstallHelpers,
} = installAddon;
const BaseComponent = () => <div />;

function componentWithInstallHelpers({ src = 'some-src' } = {}) {
  // This simulates how a component would typically apply
  // the withInstallHelpers() HOC wrapper.
  return compose(
    withInstallHelpers({ src })
  )(BaseComponent);
}

const defaultProps = (overrides = {}) => {
  const { store } = createStore();
  sinon.stub(store, 'dispatch');
  const addon = createInternalAddon(fakeAddon);
  return {
    // TODO: remove this spread. This simulates how both
    // amo/Addon and disco/Addon spread `addon` after wrapping
    // themselves in the withInstallHelpers() HOC to get
    // installURLs and iconUrl, etc.
    ...addon,
    hasAddonManager: true,
    _addonManager: getFakeAddonManagerWrapper(),
    store,
    userAgentInfo: sampleUserAgentParsed,
    ...overrides,
  };
};

function renderWithInstallHelpers({ src, ...customProps } = {}) {
  const Component = componentWithInstallHelpers({ src });

  const props = defaultProps(customProps);
  const root = shallowUntilTarget(
    <Component {...props} />, BaseComponent
  );

  return { root, dispatch: props.store.dispatch };
}

describe(__filename, () => {
  it('connects mapDispatchToProps for the component', () => {
    const _makeMapDispatchToProps = sinon.spy();
    const WrappedComponent = sinon.stub();
    withInstallHelpers({ src: 'Howdy', _makeMapDispatchToProps })(WrappedComponent);
    expect(_makeMapDispatchToProps.calledWith({ WrappedComponent, src: 'Howdy' })).toBeTruthy();
  });

  it('wraps the component in WithInstallHelpers', () => {
    const _makeMapDispatchToProps = sinon.spy();
    const Component = withInstallHelpers({ src: 'Howdy', _makeMapDispatchToProps })(() => {});
    const { store } = createStore();
    const root = shallow(<Component store={store} />);
    expect(root.type()).toEqual(WithInstallHelpers);
  });

  it('sets status when the component is mounted', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
        type: ADDON_TYPE_EXTENSION,
      }),
    });

    const addon = createInternalAddon(fakeAddon);
    const props = defaultProps({
      _addonManager,
      addon,
      // Use a spread to simulate how Addon and other components
      // do it in mapStateToProps().
      ...addon,
    });
    mount(<Component {...props} />);

    sinon.assert.calledWith(_addonManager.getAddon, addon.guid);
  });

  it('sets status when getting updated', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
        type: ADDON_TYPE_EXTENSION,
      }),
    });

    const props = defaultProps({ _addonManager });
    const root = mount(
      <Component {...props} />
    );

    const newAddon = createInternalAddon({
      ...fakeAddon, guid: '@new-guid',
    });
    // Use a spread to simulate how Addon and other components
    // do it in mapStateToProps().
    root.setProps({ addon: newAddon, ...newAddon });

    sinon.assert.calledWith(_addonManager.getAddon, '@new-guid');
  });

  it('does not set status when an update is not necessary', () => {
    const Component = componentWithInstallHelpers();
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
        type: ADDON_TYPE_EXTENSION,
      }),
    });

    const props = {
      addon: fakeAddon,
      // Use a spread to simulate how Addon and other components
      // do it in mapStateToProps().
      ...fakeAddon,
      hasAddonManager: true,
      _addonManager,
      store: createStore().store,
    };
    const root = shallowUntilTarget(<Component {...props} />, BaseComponent);

    // Update the component with the same props (i.e. same add-on guid)
    // and make sure the status is not set.
    root.setProps(props);
    sinon.assert.notCalled(_addonManager.getAddon);
  });

  it('throws without a src', () => {
    expect(() => {
      withInstallHelpers({})(() => {});
    }).toThrowError(/src is required/);
  });

  it('sets the current status in componentDidMount with an addonManager', () => {
    const _addonManager = getFakeAddonManagerWrapper({
      getAddon: Promise.resolve({
        isActive: true,
        isEnabled: true,
        type: ADDON_TYPE_EXTENSION,
      }),
    });

    const props = defaultProps({ _addonManager });
    mount(
      <WithInstallHelpers
        {...props}
        WrappedComponent={() => <div />}
      />
    );
    sinon.assert.called(_addonManager.getAddon);
  });

  it('does not set the current status in componentDidMount without an addonManager', () => {
    const _addonManager = getFakeAddonManagerWrapper();

    const props = defaultProps({
      hasAddonManager: false, _addonManager,
    });
    mount(
      <WithInstallHelpers
        {...props}
        WrappedComponent={() => <div />}
      />
    );
    sinon.assert.notCalled(_addonManager.getAddon);
  });

  describe('findInstallURL', () => {
    const _findInstallURL = ({
      addonFiles = [],
      userAgent = userAgentsByPlatform.windows.firefox40,
    } = {}) => {
      const addon = addonFiles && createInternalAddon(createFakeAddon({
        files: addonFiles,
      }));
      const userAgentInfo = userAgent && UAParser(userAgent);

      return installAddon.findInstallURL({
        installURLs: addon && addon.installURLs, userAgentInfo,
      });
    };

    it('finds a Windows install URL', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_MAC,
            url: 'https://a.m.o/files/mac.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.windows.firefox40,
      }))
        .toEqual('https://a.m.o/files/windows.xpi');
    });

    it('finds a Mac OS install URL', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_MAC,
            url: 'https://a.m.o/files/mac.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.mac.firefox33,
      }))
        .toEqual('https://a.m.o/files/mac.xpi');
    });

    it('finds a Linux install URL', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_LINUX,
            url: 'https://a.m.o/files/linux.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.linux.firefox10,
      }))
        .toEqual('https://a.m.o/files/linux.xpi');
    });

    it('finds an Android mobile install URL', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_ANDROID,
            url: 'https://a.m.o/files/android.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.android.firefox40Mobile,
      }))
        .toEqual('https://a.m.o/files/android.xpi');
    });

    it('finds an Android tablet install URL', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_ANDROID,
            url: 'https://a.m.o/files/android.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.android.firefox40Tablet,
      }))
        .toEqual('https://a.m.o/files/android.xpi');
    });

    it('returns an all-platform URL for unsupported platforms', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_ALL,
            url: 'https://a.m.o/files/all.xpi',
          },
        ],
        // This platform is unsupported.
        userAgent: userAgentsByPlatform.firefoxOS.firefox26,
      }))
        .toEqual('https://a.m.o/files/all.xpi');
    });

    it('gives preference to a specific platform URL', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            // Make sure the all-platform file doesn't win.
            platform: OS_ALL,
            url: 'https://a.m.o/files/all.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.windows.firefox40,
      }))
        .toEqual('https://a.m.o/files/windows.xpi');
    });

    it('returns undefined when nothing else matches', () => {
      expect(_findInstallURL({
        addonFiles: [
          {
            platform: OS_WINDOWS,
            url: 'https://a.m.o/files/windows.xpi',
          },
          {
            platform: OS_MAC,
            url: 'https://a.m.o/files/mac.xpi',
          },
        ],
        userAgent: userAgentsByPlatform.android.firefox40Tablet,
      }))
        .toEqual(undefined);
    });

    it('returns undefined when no files exist', () => {
      expect(_findInstallURL({
        addonFiles: [],
        userAgent: userAgentsByPlatform.windows.firefox40,
      }))
        .toEqual(undefined);
    });

    it('requires installURLs', () => {
      expect(() => _findInstallURL({ addonFiles: null }))
        .toThrow(/installURLs parameter is required/);
    });

    it('requires userAgentInfo', () => {
      expect(() => _findInstallURL({ userAgent: null }))
        .toThrow(/userAgentInfo parameter is required/);
    });
  });
});

describe(`${__filename}: withInstallHelpers`, () => {
  const src = 'TestInstallAddon';
  const WrappedComponent = sinon.stub();
  let configStub;
  let mapDispatchToProps;

  function getMapStateToProps({
    _tracking, installations = {}, state = {} } = {}
  ) {
    return mapStateToProps(
      { installations, addons: {} }, state, { _tracking }
    );
  }

  beforeAll(() => {
    mapDispatchToProps = makeMapDispatchToProps({
      WrappedComponent, src,
    });
  });

  beforeEach(() => {
    configStub = sinon.stub(config, 'get')
      .withArgs('server').returns(false);
  });

  describe('setCurrentStatus', () => {
    it('sets the status to ENABLED when an enabled add-on found', () => {
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers(addon);
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: ENABLED, url: installURL,
            }),
          );
        });
    });

    it('lets you pass custom props to setCurrentStatus', () => {
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers(addon);
      const { setCurrentStatus } = root.instance().props;

      dispatch.reset();
      return setCurrentStatus(addon)
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: ENABLED, url: installURL,
            }),
          );
        });
    });

    it('sets the status to DISABLED when a disabled add-on found', () => {
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon,
        _addonManager: getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: false,
            type: ADDON_TYPE_EXTENSION,
          }),
        }),
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: DISABLED, url: installURL,
            }),
          );
        });
    });

    it('sets the status to DISABLED when an inactive add-on found', () => {
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon,
        _addonManager: getFakeAddonManagerWrapper({
          getAddon: Promise.resolve({
            isActive: false,
            isEnabled: true,
            type: ADDON_TYPE_EXTENSION,
          }),
        }),
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: DISABLED, url: installURL,
            }),
          );
        });
    });

    it('sets the status to ENABLED when an enabled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({ type: ADDON_TYPE_THEME, isActive: true, isEnabled: true }),
      });
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: ENABLED, url: installURL,
            }),
          );
        });
    });

    it('sets the status to DISABLED when an inactive theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({
          isActive: false,
          isEnabled: true,
          type: ADDON_TYPE_THEME,
        }),
      });
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: DISABLED, url: installURL,
            }),
          );
        });
    });

    it('sets the status to DISABLED when a disabled theme is found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.resolve({
          isActive: true,
          isEnabled: false,
          type: ADDON_TYPE_THEME,
        }),
      });
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: DISABLED, url: installURL,
            }),
          );
        });
    });

    it('sets the status to UNINSTALLED when not found', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        getAddon: Promise.reject(),
      });
      const installURL = 'http://the.url';
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: UNINSTALLED, url: installURL,
            }),
          );
        });
    });

    it('dispatches error when setCurrentStatus gets exception', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        // Resolve a null addon which will trigger an exception.
        getAddon: Promise.resolve(null),
      });
      const addon = createInternalAddon(fakeAddon);

      const { root, dispatch } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { setCurrentStatus } = root.instance().props;

      return setCurrentStatus()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: ERROR, error: FATAL_ERROR,
            }),
          );
        });
    });
  });

  describe('makeProgressHandler', () => {
    it('sets the download progress on STATE_DOWNLOADING', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_DOWNLOADING', progress: 300, maxProgress: 990 });
      sinon.assert.calledWith(dispatch, {
        type: DOWNLOAD_PROGRESS,
        payload: { downloadProgress: 30, guid },
      });
    });

    it('sets status to error on onDownloadFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadFailed' });
      sinon.assert.calledWith(dispatch, {
        type: 'INSTALL_ERROR',
        payload: { guid, error: DOWNLOAD_FAILED },
      });
    });

    it('sets status to installing onDownloadEnded', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onDownloadEnded' });
      sinon.assert.calledWith(dispatch, setInstallState({
        guid, status: INSTALLING,
      }));
    });

    it('resets status to uninstalled on onInstallCancelled', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallCancelled' });
      sinon.assert.calledWith(dispatch, {
        type: INSTALL_CANCELLED,
        payload: { guid },
      });
    });

    it('sets status to error on onInstallFailed', () => {
      const dispatch = sinon.spy();
      const guid = '{my-addon}';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'STATE_SOMETHING' }, { type: 'onInstallFailed' });
      sinon.assert.calledWith(dispatch, {
        type: 'INSTALL_ERROR',
        payload: { guid, error: INSTALL_FAILED },
      });
    });

    it('does nothing on unknown events', () => {
      const dispatch = sinon.spy();
      const guid = 'foo@addon';
      const handler = makeProgressHandler(dispatch, guid);
      handler({ state: 'WAT' }, { type: 'onNothingPerformed' });
      sinon.assert.notCalled(dispatch);
    });
  });

  describe('enable', () => {
    it('calls addonManager.enable() and content notification', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        permissionPromptsEnabled: false,
      });
      const name = 'the-name';
      const iconUrl = 'https://a.m.o/some-icon.png';
      const addon = createInternalAddon({
        ...fakeAddon,
        name,
        icon_url: iconUrl,
      });
      const { root } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { enable } = root.instance().props;

      const fakeShowInfo = sinon.stub();
      return enable({ _showInfo: fakeShowInfo })
        .then(() => {
          sinon.assert.calledWith(fakeAddonManager.enable, addon.guid);
          sinon.assert.calledWith(fakeShowInfo, { name, iconUrl });
        });
    });

    it('calls addonManager.enable() without content notification', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper({
        permissionPromptsEnabled: true,
      });
      const name = 'the-name';
      const iconUrl = 'https://a.m.o/some-icon.png';
      const addon = createInternalAddon({
        ...fakeAddon,
        name,
        icon_url: iconUrl,
      });
      const { root } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { enable } = root.instance().props;

      const fakeShowInfo = sinon.stub();
      return enable({ _showInfo: fakeShowInfo })
        .then(() => {
          sinon.assert.calledWith(fakeAddonManager.enable, addon.guid);
          sinon.assert.neverCalledWith(fakeShowInfo, { name, iconUrl });
        });
    });

    it('dispatches a FATAL_ERROR', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error('hai'))),
      };
      const addon = createInternalAddon(fakeAddon);
      const { dispatch, root } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { enable } = root.instance().props;

      return enable()
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid, status: ERROR, error: FATAL_ERROR,
            }),
          );
        });
    });

    it('does not dispatch a FATAL_ERROR when setEnabled is missing', () => {
      const fakeAddonManager = {
        enable: sinon.stub().returns(Promise.reject(new Error(SET_ENABLE_NOT_AVAILABLE))),
      };
      const { root, dispatch } = renderWithInstallHelpers({
        _addonManager: fakeAddonManager,
      });
      const { enable } = root.instance().props;

      return enable()
        .then(() => {
          sinon.assert.notCalled(dispatch);
        });
    });
  });

  describe('install', () => {
    const installURL = 'https://mysite.com/download.xpi';

    it('calls addonManager.install()', () => {
      const addon = createInternalAddon(createFakeAddon({
        files: [{ platform: OS_ALL, url: installURL }],
      }));
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const { root } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager, src,
      });
      const { install } = root.instance().props;

      return install(addon)
        .then(() => {
          sinon.assert.calledWith(
            fakeAddonManager.install,
            installURL,
            sinon.match.func,
            { src }
          );
        });
    });

    it('tracks an addon install', () => {
      const addon = createInternalAddon(fakeAddon);
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const { root } = renderWithInstallHelpers({
        ...addon,
        _tracking: fakeTracking,
      });
      const { install } = root.instance().props;

      return install(addon)
        .then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: TRACKING_TYPE_EXTENSION,
            category: INSTALL_CATEGORY,
            label: addon.name,
          });
        });
    });

    it('should dispatch START_DOWNLOAD', () => {
      const addon = createInternalAddon(fakeAddon);
      const { root, dispatch } = renderWithInstallHelpers(addon);
      const { install } = root.instance().props;

      return install(addon)
        .then(() => {
          sinon.assert.calledWith(dispatch, {
            type: START_DOWNLOAD,
            payload: { guid: addon.guid },
          });
        });
    });

    it('should dispatch SHOW_INFO if permissionPromptsEnabled is false', () => {
      const iconUrl = 'some-icon-url';
      const addon = createInternalAddon({
        ...fakeAddon, icon_url: iconUrl,
      });
      const props = {
        ...addon,
        _addonManager: getFakeAddonManagerWrapper({
          permissionPromptsEnabled: false,
        }),
      };
      const { root, dispatch } = renderWithInstallHelpers(props);
      const { install } = root.instance().props;

      return install(addon)
        .then(() => {
          sinon.assert.calledWith(dispatch, {
            type: SHOW_INFO,
            payload: {
              addonName: addon.name,
              imageURL: iconUrl,
              closeAction: sinon.match.func,
            },
          });

          const arg = dispatch.secondCall.args[0];
          // Prove we're looking at the SHOW_INFO dispatch.
          expect(arg.type).toEqual(SHOW_INFO);

          // Test that close action dispatches.
          dispatch.reset();
          arg.payload.closeAction();
          sinon.assert.calledWith(dispatch, {
            type: CLOSE_INFO,
          });
        });
    });

    it('should not dispatch SHOW_INFO if permissionPromptsEnabled is true', () => {
      const iconUrl = 'some-icon-url';
      const addon = createInternalAddon({
        ...fakeAddon, icon_url: iconUrl,
      });
      const props = {
        ...addon,
        _addonManager: getFakeAddonManagerWrapper({
          permissionPromptsEnabled: true,
        }),
      };
      const { root, dispatch } = renderWithInstallHelpers(props);
      const { install } = root.instance().props;

      return install(addon)
        .then(() => {
          sinon.assert.neverCalledWith(dispatch, {
            type: SHOW_INFO,
            payload: {
              addonName: addon.name,
              imageURL: iconUrl,
              closeAction: sinon.match.func,
            },
          });
        });
    });

    it('dispatches error when addonManager.install throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.install = sinon.stub().returns(Promise.reject());

      const addon = createInternalAddon(fakeAddon);
      const { root, dispatch } = renderWithInstallHelpers({
        ...addon, _addonManager: fakeAddonManager,
      });
      const { install } = root.instance().props;

      return install(addon)
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: ERROR,
              error: FATAL_INSTALL_ERROR,
            }),
          );
        });
    });
  });

  describe('uninstall', () => {
    it('calls addonManager.uninstall()', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const addon = createInternalAddon(fakeAddon);
      const { root, dispatch } = renderWithInstallHelpers({
        ...addon,
        _addonManager: fakeAddonManager,
      });
      const { uninstall } = root.instance().props;

      return uninstall(addon)
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({ guid: addon.guid, status: UNINSTALLING }),
          );
          sinon.assert.calledWith(fakeAddonManager.uninstall, addon.guid);
        });
    });

    it('dispatches error when addonManager.uninstall throws', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      fakeAddonManager.uninstall = sinon.stub().returns(
        Promise.reject(new Error('Add-on Manager uninstall error'))
      );
      const addon = createInternalAddon(fakeAddon);
      const { root, dispatch } = renderWithInstallHelpers({
        ...addon,
        _addonManager: fakeAddonManager,
      });
      const { uninstall } = root.instance().props;

      return uninstall(addon)
        .then(() => {
          sinon.assert.calledWith(
            dispatch,
            setInstallState({ guid: addon.guid, status: UNINSTALLING }),
          );
          sinon.assert.calledWith(
            dispatch,
            setInstallState({
              guid: addon.guid,
              status: ERROR,
              error: FATAL_UNINSTALL_ERROR,
            }),
          );
        });
    });

    it('tracks an addon uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const addon = createInternalAddon(fakeAddon);
      const { root } = renderWithInstallHelpers({
        ...addon,
        _addonManager: fakeAddonManager,
        _tracking: fakeTracking,
      });
      const { uninstall } = root.instance().props;

      return uninstall(addon)
        .then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: TRACKING_TYPE_EXTENSION,
            category: UNINSTALL_CATEGORY,
            label: addon.name,
          });
        });
    });

    it('tracks a theme uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const addon = createInternalAddon(fakeTheme);
      const { root } = renderWithInstallHelpers({
        ...addon,
        _addonManager: fakeAddonManager,
        _tracking: fakeTracking,
      });
      const { uninstall } = root.instance().props;

      return uninstall(addon)
        .then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: TRACKING_TYPE_THEME,
            category: UNINSTALL_CATEGORY,
            label: addon.name,
          });
        });
    });

    it('tracks a unknown type uninstall', () => {
      const fakeAddonManager = getFakeAddonManagerWrapper();
      const fakeTracking = {
        sendEvent: sinon.spy(),
      };
      const addon = createInternalAddon({
        ...fakeAddon, type: 'not-a-real-type',
      });
      const { root } = renderWithInstallHelpers({
        ...addon,
        _addonManager: fakeAddonManager,
        _tracking: fakeTracking,
      });
      const { uninstall } = root.instance().props;

      return uninstall(addon)
        .then(() => {
          sinon.assert.calledWith(fakeTracking.sendEvent, {
            action: 'invalid',
            category: UNINSTALL_CATEGORY,
            label: addon.name,
          });
        });
    });
  });

  describe('mapDispatchToProps', () => {
    let fakeDispatch;

    beforeEach(() => {
      fakeDispatch = sinon.stub();
    });

    it('is empty when there is no navigator', () => {
      sinon.restore();
      configStub = sinon.stub(config, 'get').withArgs('server').returns(true);
      expect(mapDispatchToProps(sinon.spy())).toEqual({ WrappedComponent });
      expect(configStub.calledOnce).toBeTruthy();
      expect(configStub.calledWith('server')).toBeTruthy();
    });

    it('requires installURLs', () => {
      const props = defaultProps();
      delete props.installURLs;
      expect(() => {
        makeMapDispatchToProps({})(fakeDispatch, props);
      }).toThrowError(/installURLs is required/);
    });

    it('requires userAgentInfo', () => {
      const props = defaultProps();
      delete props.userAgentInfo;
      expect(() => {
        makeMapDispatchToProps({})(fakeDispatch, props);
      }).toThrowError(/userAgentInfo is required/);
    });

    it('can wrap an extension with the right props', () => {
      const props = defaultProps();
      expect(() => {
        makeMapDispatchToProps({})(fakeDispatch, props);
      }).not.toThrowError();
    });

    describe('previewTheme', () => {
      it('calls theme action with THEME_PREVIEW', () => {
        const addon = createInternalAddon(fakeTheme);
        const { root, dispatch } = renderWithInstallHelpers(addon);
        const { previewTheme } = root.instance().props;

        const themeAction = sinon.spy();
        const node = sinon.stub();
        previewTheme(node, themeAction);
        sinon.assert.calledWith(themeAction, node, THEME_PREVIEW);
        sinon.assert.calledWith(dispatch, {
          type: THEME_PREVIEW,
          payload: {
            guid: addon.guid,
            themePreviewNode: node,
          },
        });
      });
    });

    describe('resetThemePreview', () => {
      it('calls theme action with THEME_RESET_PREVIEW', () => {
        const addon = createInternalAddon(fakeAddon);
        const { root, dispatch } = renderWithInstallHelpers(addon);
        const { resetThemePreview } = root.instance().props;

        const themeAction = sinon.spy();
        const node = sinon.stub();
        resetThemePreview(node, themeAction);
        sinon.assert.calledWith(themeAction, node, THEME_RESET_PREVIEW);
        sinon.assert.calledWith(dispatch, {
          type: THEME_RESET_PREVIEW,
          payload: {
            guid: addon.guid,
          },
        });
      });
    });
  });

  describe('installTheme', () => {
    const baseAddon = {
      name: 'hai-theme',
      guid: '{install-theme}',
      status: UNINSTALLED,
      type: ADDON_TYPE_THEME,
    };

    function installThemeStubs() {
      return {
        _themeAction: sinon.spy(),
        _tracking: {
          sendEvent: sinon.spy(),
        },
      };
    }

    it('installs the theme when it is not installed', () => {
      const addon = { ...baseAddon };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      expect(stubs._themeAction.calledWith(node, THEME_INSTALL)).toBeTruthy();
    });

    it('tracks a theme install', () => {
      const addon = { ...baseAddon };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      expect(stubs._tracking.sendEvent.calledWith({
        action: TRACKING_TYPE_THEME,
        category: INSTALL_CATEGORY,
        label: 'hai-theme',
      })).toBeTruthy();
    });

    it('does not try to install theme if INSTALLED', () => {
      const addon = { ...baseAddon, status: INSTALLED };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      expect(stubs._tracking.sendEvent.called).toBeFalsy();
      expect(stubs._themeAction.called).toBeFalsy();
    });

    it('does not try to install theme if it is an extension', () => {
      const addon = { ...baseAddon, type: ADDON_TYPE_EXTENSION };
      const node = sinon.stub();
      const stubs = installThemeStubs();
      installTheme(node, addon, stubs);
      expect(stubs._tracking.sendEvent.called).toBeFalsy();
      expect(stubs._themeAction.called).toBeFalsy();
    });
  });

  describe('getBrowserThemeData', () => {
    it('formats the browser theme data', () => {
      const { getBrowserThemeData } = getMapStateToProps();
      sinon.stub(themePreview, 'getThemeData').returns({ foo: 'wat' });
      expect(getBrowserThemeData({ some: 'data' })).toEqual('{"foo":"wat"}');
    });
  });

  describe('toggleThemePreview', () => {
    it('calls previewTheme if theme is not enabled', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: UNINSTALLED,
            guid,
          },
        },
      }, {
        guid,
      });
      props.previewTheme = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      expect(props.previewTheme.calledWith(node, themeAction)).toBeTruthy();
    });

    it('calls resetPreviewTheme', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: UNINSTALLED,
            isPreviewingTheme: true,
            guid,
          },
        },
      }, {
        guid,
      });
      props.resetThemePreview = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      expect(props.resetThemePreview.calledWith(node, themeAction)).toBeTruthy();
    });

    it('logs if theme is not available', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: UNINSTALLED,
            isPreviewingTheme: true,
          },
        },
      }, {
        guid,
      });
      props.resetThemePreview = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      expect(fakeLog.info.calledWith('Theme foo@bar.com could not be found')).toBeTruthy();
    });

    it('logs if theme is already enabled', () => {
      const fakeLog = {
        info: sinon.spy(),
      };
      const themeAction = sinon.spy();
      const node = 'fake-node';
      const guid = 'foo@bar.com';
      const props = mapStateToProps({
        installations: {
          [guid]: {
            status: ENABLED,
            isPreviewingTheme: true,
            guid,
          },
        },
      }, {
        guid,
      });
      props.resetThemePreview = sinon.spy();
      props.toggleThemePreview(node, themeAction, fakeLog);
      expect(
        fakeLog.info.calledWith(sinon.match('Theme foo@bar.com is already enabled'))
      ).toBeTruthy();
    });
  });
});
