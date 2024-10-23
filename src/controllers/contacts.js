import {
  getAllContacts,
  getContactById,
  createContact,
  deleteContact,
  updateContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';

export const createContactController = async (req, res, next) => {
  const reqData = { ...req.body, userId: req.user._id };
  const contact = await createContact(reqData);

  res.status(201).json({
    status: 201,
    message: `Successfully created a contact!`,
    data: contact,
  });
};

export const getContactsController = async (req, res, next) => {
  try {
    const { page, perPage } = parsePaginationParams(req.query);
    const { sortBy, sortOrder } = parseSortParams(req.query);
    const filter = parseFilterParams(req.query);
    const contacts = await getAllContacts({
      page,
      perPage,
      sortBy,
      sortOrder,
      filter,
      userId: req.user._id.toString(),
    });

    res.json({
      status: 200,
      message: 'Successfully found students!',
      data: contacts,
    });
  } catch (err) {
    next(err);
  }
};

export const getContactByIdController = async (req, res, next) => {
  const { contactId } = req.params;
  const contact = await getContactById(contactId);

  if (contact.userId.toString() !== req.user._id.toString()) {
    res.status(401).json({
      status: 401,
      message: 'You need to have access rights to this contact',
    });
    return;
  }

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.json({
    status: 200,
    message: `Successfully found contact with id ${contactId}!`,
    data: contact,
  });
};
export const deleteContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const authContact = await getContactById(contactId);
  if (authContact.userId.toString() !== req.user._id.toString()) {
    res.status(401).json({
      status: 401,
      message: 'You need to access rights to this contact',
    });
    return;
  }
  const contact = await deleteContact(contactId);

  if (!contact) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  res.status(204).send();
};

export const upsertContactController = async (req, res, next) => {
  const { contactId } = req.params;

  const result = await updateContact(contactId, req.body, {
    upsert: true,
  });

  if (!result) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  const status = result.isNew ? 201 : 200;

  res.status(status).json({
    status,
    message: `Successfully upserted a contact!`,
    data: result.contact,
  });
};
export const patchContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const { body } = req;
  const authContact = await getContactById(contactId);

  if (authContact.userId.toString() !== req.user._id.toString()) {
    res.status(401).json({
      status: 401,
      message: 'You need to access rights to this contact',
    });
    return;
  }
  const { result } = await updateContact(contactId, body);
  console.log(result);

  if (!result) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  res.json({
    status: 200,
    message: `Successfully patched a contact!`,
    data: result.contact,
  });
};
