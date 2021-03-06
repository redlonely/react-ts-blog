import React, { PureComponent } from 'react'
import './comment.scss'

import Editor from '../../component/Editor'

import storage from '../../utils/storage'

//antd
import { message } from 'antd'

// redux
import { connect } from 'react-redux'
import { login, logout } from '../../store/actions/userinfo'
import { getComments, setComment, payload } from '../../store/actions/comments'
import { UserInfo, Comment as IComment } from '../../types'
import lodash from 'lodash'

// http api
import { DeleteComment, GetComments } from '../../api/Comment'
import {
  GetRandomAvatar,
  GetUserAddress,
  UserAuthentication,
  UserLogin,
  UserLogout,
} from '../../api/User'
// import { UserLike } from '../../api/LikeRecord'

interface Props {
  comments: any
  userinfo: UserInfo
  login: Function
  logout: Function
  getComments: Function
  setComment: Function
}

interface State {
  size: number
}

// @ts-ignore
@connect((state) => state, {
  login,
  logout,
  getComments,
  setComment,
})
class Comment extends PureComponent<Props, State> {
  state: State = {
    size: 15,
  }
  // 组件挂载
  componentDidMount() {
    this.autoLogin()
    // document && document.documentElement
    //   ? (document.documentElement.scrollTop = 0)
    //   : null
    this.updateComments()
    // 自动登录
  }

  autoLogin = () => {
    if (!lodash.isEmpty(storage.get('token'))) {
      UserAuthentication().then((res: any) => {
        if (res.code && res.payload) {
          let userinfo = res.payload
          // 存 Redux
          this.props.login(userinfo)
          storage.set('userinfo', userinfo)
          // message.success('欢迎你! ' + userinfo.nickname, 3)
        } else {
          UserLogout()
          this.logout()
          storage.del('userinfo')
          storage.del('token')
          message.success('登录过期，请重新登录! ', 3)
        }
      })
    }
  }

  updateComments = async () => {
    try {
      const { size } = this.state
      const { page } = this.props.comments
      let { comments }: any = await GetComments(page, size)
      this.props.getComments({ page, size, comments })
    } catch (err) {
      console.warn(err)
    }
  }

  thumbComment = async (comm: any, _id: string, like_status: number) => {
    message.info('点赞功能暂未开放！', 1)
    // this.props.setComment({ comm_id: comm._id, _id, like_status })
    // const ret = await UserLike(comm._id)
    // console.log(ret)
  }

  getMore = async () => {
    try {
      const { size } = this.state
      const { page } = this.props.comments
      let { comments }: any = await GetComments(page + 1, size)
      if (comments[0] === undefined) {
        message.info('没有更多留言了~', 3)
      }
      this.props.getComments({ page: page + 1, size, comments })
      return false
    } catch (err) {
      console.warn(err)
      return true
    }
  }

  // 登录
  login = async (userinfo: UserInfo) => {
    try {
      // 用户地址
      const address = (await GetUserAddress())?.result
      // 随机头像
      const avatar = ((await GetRandomAvatar(userinfo.gender)) as any).imgurl
      // 用户信息
      let { code, msg, token } = await UserLogin({
        ...userinfo,
        avatar,
        address,
      })
      // 判断是否登录成功！
      if (code && token) {
        // 存Token
        storage.set('token', token)
        // 存 Redux
        this.props.login(userinfo)
        storage.set('userinfo', userinfo)
        message.success('欢迎你! ' + userinfo.nickname, 3)
        return true
      } else {
        message.warn('登录失败! ' + msg, 3)
        return false
      }
    } catch (err) {
      console.warn(err)
    }
  }

  // 注销
  logout = async () => {
    try {
      this.props.logout()
      const { code } = (await UserLogout()) as any
      return code ? true : false
    } catch (err) {
      return false
    }
  }

  //  删除评论
  deleteComment = async (fId: string, id: string) => {
    try {
      if (await DeleteComment(fId, id)) {
        this.updateComments()
        return true
      }
      return false
    } catch (err) {
      console.log(err)
      return false
    }
  }

  render() {
    const { userinfo } = this.props
    const { comments } = this.props.comments
    const { login, logout, getMore, deleteComment, thumbComment } = this

    return (
      <div className="comment">
        {/* <Search /> */}
        <Editor
          thumbComment={thumbComment}
          deleteComment={deleteComment}
          updateComments={this.updateComments}
          userinfo={userinfo}
          comments={comments}
          login={login}
          logout={logout}
          getMore={getMore}
        />
      </div>
    )
  }
}

export default Comment
