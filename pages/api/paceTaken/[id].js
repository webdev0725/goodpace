import { admin } from "../../../utils/auth/firebaseAdmin"

export default async (req, res) => {
  const { method } = req

  switch (method) {
    case 'GET':
      return await handleGet(req, res)
    case 'PUT':
      return await handlePut(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

// Return a pace's worth of info
const handleGet = async (req, res) => {
  const { query: { id } } = req
  console.log('paceTaken/<id>/_ :: req.query.id', id)

  try {
    const doc = await admin.firestore()
      .collection('paces:taken')
      .doc(id)
      .get()
      .catch((error) => {
        res.status(400).json({ error })
      })

    if (!doc) { return res.status(404).json({ status: 404, message: 'Not found' })}
    
    const data = doc.data()
    let paceData = {
      "id": doc.id,
      ...data
    }  
    res.status(200).json(paceData)

  } catch (error) {
    
    res.status(500).json({ error })
  }

}

const handlePut = async (req, res) => {
  const { 
    body,
    cookies,
    query
  } = req
  
  try {
    const auth = JSON.parse(cookies.auth)
  
    console.log('paceId', query.id) // The url query string
    console.log('body', body) // The request body
    console.log('auth', auth)
    
    if (!query.id) res.status(400).json({ message: "No id found"})
    if (!body.text) res.status(400).json({ message: "No text found"})
    if (!auth) res.status(400).json({ message: "No auth found"})

    const paceId = query.id
    
    const decodedToken = await admin.auth().verifyIdToken(auth.token, true)
      .catch((error) => {
        console.log(error)
        res.status(500).json({ error })
      })
    let uid = decodedToken.uid
    console.log('uid', uid)
    
    await admin.firestore()
      .doc(`/paces:taken/${paceId}`)
      .set({
        response: body.text
      }, { merge: true })
    
    res.status(200).json({ message: 'periodic save success' })

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'update paceTaken failed'})
  }
  
}