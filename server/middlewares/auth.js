exports.getAuthorize = async (req, res, next) => {
  const headerAuthorize =
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"] ||
    req.headers.authorization

  if (!headerAuthorize) {
    return { error: "Cannot connect." }
  }

  return next()
}
